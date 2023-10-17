import { Libp2p } from "libp2p";
import { genListenAddresses } from "../utils/listen-addresses";
import { createAndStartNode } from "../utils/create-and-start-node";
import { NodeConfig } from "./node-config";
import { pipe } from "it-pipe";
import { PeerId } from "@libp2p/interfaces/dist/src/peer-id";
import { archLogger } from "../logger/chalk-theme";
import { BigNumber, ethers } from "ethers";
import { getWeb3Interface } from "../scripts/web3-interface";
import { inMemoryStore } from "../utils/onchain-data";
import { SarcophagusValidationError, StreamCommsError } from "../utils/error-codes";
import type { Stream } from "@libp2p/interface-connection";
import { signPacked } from "../utils/signature";
import { getBlockTimestamp } from "../utils/blockchain/helpers";
import { NetworkContext } from "../network-config";
import { NEGOTIATION_SIGNATURE_STREAM } from "@sarcophagus-org/sarcophagus-v2-sdk";

// If current block timestamp is further than the creation time passed to the arch
// by this amount, then the arch will throw an error
const CREATION_TIMESTAMP_DRIFT_ALLOWED_MS = 2000 * 60; // 2 minutes

export interface ListenAddressesConfig {
  signalServerList: string[];
}

export interface ArchaeologistInit {
  name: string;
  peerId: PeerId;
  listenAddresses?: string[] | undefined;
  isBootstrap?: boolean;
  listenAddressesConfig?: ListenAddressesConfig;
  bootstrapList?: string[];
}

interface SarcophagusNegotiationParams {
  maxRewrapInterval: number;
  maximumResurrectionTime: number;
  diggingFeePerSecond: string;
  timestamp: number;
  curseFee: string;
}

export class Archaeologist {
  public node: Libp2p;
  public name: string;

  private nodeConfig: NodeConfig;
  private peerId: PeerId;
  private listenAddresses: string[] | undefined;
  private listenAddressesConfig: ListenAddressesConfig | undefined;

  constructor(options: ArchaeologistInit) {
    if (!options.listenAddresses && !options.listenAddressesConfig) {
      throw Error(
        "Either listenAddresses or listenAddressesConfig must be provided in archaeologist constructor"
      );
    }

    this.nodeConfig = new NodeConfig({
      bootstrapList: options.bootstrapList,
      isBootstrap: options.isBootstrap,
    });

    this.name = options.name;
    this.peerId = options.peerId;
    this.listenAddresses = options.listenAddresses;
    this.listenAddressesConfig = options.listenAddressesConfig;
  }

  async initLibp2pNode(): Promise<Libp2p> {
    if (this.listenAddressesConfig) {
      const { signalServerList } = this.listenAddressesConfig!;
      this.listenAddresses = genListenAddresses(
        signalServerList,
        this.peerId.toJSON().id,
        false,
        process.env.DOMAIN
      );
    }

    this.nodeConfig.add("peerId", this.peerId);
    this.nodeConfig.add("addresses", { listen: this.listenAddresses });

    this.node = await createAndStartNode(this.name, this.nodeConfig.configObj);

    return this.node;
  }

  async shutdown() {
    archLogger.info(`${this.name} is stopping...`, true);
    await this.node.stop();
  }

  async restartNode() {
    if (!this.node.isStarted()) {
      await this.node.start();
      return;
    }

    // If the node has open connections, dont restart.
    if (this.node.getConnections().length) {
      return;
    }

    archLogger.debug("node restarting on set interval");
    await this.node.stop();
    await this.node.start();
  }

  streamToBrowser(stream: Stream, message: string) {
    pipe([new TextEncoder().encode(message)], stream);
  }

  emitError(stream: Stream, error: StreamCommsError) {
    this.streamToBrowser(stream, JSON.stringify({ error }));
    archLogger.error(`Error: ${error.message}`, { logTimestamp: true });
  }

  async setupSarcophagusNegotiationStreams() {
    const errorMessagePrefix = `Archaeologist ${this.peerId.toString()} declined to sign: `;

    const _handleNegotiationSignatureStream = async (
      networkContext: NetworkContext,
      { stream }: { stream: Stream }
    ) => {
      try {
        await pipe(stream, async source => {
          for await (const data of source) {
            // validate that supplied sarcophagus parameters meet the requirements of the archaeologist
            try {
              const {
                maxRewrapInterval,
                maximumResurrectionTime,
                diggingFeePerSecond, // this is assumed to, and should, be in wei
                timestamp,
                curseFee,
              }: SarcophagusNegotiationParams = JSON.parse(
                new TextDecoder().decode(data.subarray())
              );
              console.log(`Negotiating on ${networkContext.networkName} (${networkContext.chainId})`);

              const maximumRewrapIntervalBN = BigNumber.from(maxRewrapInterval);
              const maximumResurrectionTimeBN = BigNumber.from(maximumResurrectionTime);

              /**
               * Validate maxRewrapInterval supplied is in line with our maxRewrapInterval
               */
              if (
                maximumRewrapIntervalBN.gt(
                  inMemoryStore.get(networkContext.chainId)!.profile!.maximumRewrapInterval
                )
              ) {
                this.emitError(stream, {
                  code: SarcophagusValidationError.MAX_REWRAP_INTERVAL_TOO_LARGE,
                  message: `${errorMessagePrefix} \n Maximum rewrap interval too large.  
                  \n Got: ${maximumRewrapIntervalBN.toString()}
                  \n Maximum allowed: ${inMemoryStore
                    .get(networkContext.chainId)!
                    .profile!.maximumRewrapInterval.toString()}`,
                });
                return;
              }

              /**
               * Validate maximumResurrectionTime supplied is within our maximumResurrectionTime
               */

              if (
                maximumResurrectionTimeBN.gt(
                  inMemoryStore.get(networkContext.chainId)!.profile!.maximumResurrectionTime
                )
              ) {
                this.emitError(stream, {
                  code: SarcophagusValidationError.MAX_RESURRECTION_TIME_TOO_LARGE,
                  message: `${errorMessagePrefix} \n Maximum resurrection time is too large.  
                  \n Got: ${maximumResurrectionTimeBN.toString()}
                  \n Maximum allowed: ${inMemoryStore
                    .get(networkContext.chainId)!
                    .profile!.maximumResurrectionTime.toString()}`,
                });
                return;
              }

              /**
               * Validate supplied digging fee per second is sufficient
               */
              if (
                ethers.utils
                  .parseEther(diggingFeePerSecond)
                  .lt(
                    inMemoryStore.get(networkContext.chainId)!.profile!.minimumDiggingFeePerSecond
                  )
              ) {
                this.emitError(stream, {
                  code: SarcophagusValidationError.DIGGING_FEE_TOO_LOW,
                  message: `${errorMessagePrefix} \n Digging fee per second sent is too low.  
                  \n Got: ${diggingFeePerSecond.toString()}
                  \n Minimum needed: ${inMemoryStore
                    .get(networkContext.chainId)!
                    .profile!.minimumDiggingFeePerSecond.toString()}`,
                });
                return;
              }

              /**
               * Validate supplied curse fee matches archaeologist's required curse fee
               */
              if (
                ethers.utils
                  .parseEther(curseFee)
                  .lt(inMemoryStore.get(networkContext.chainId)!.profile!.curseFee)
              ) {
                this.emitError(stream, {
                  code: SarcophagusValidationError.CURSE_FEE_TOO_LOW,
                  message: `${errorMessagePrefix} \n Curse fee sent is too low.  
                  \n Got: ${curseFee.toString()}
                  \n Minimum needed: ${inMemoryStore
                    .get(networkContext.chainId)!
                    .profile!.curseFee.toString()}`,
                });
                return;
              }

              /**
               * Validate negotiation timestamp is within allowed drift of when we received this request
               */
              if (
                timestamp >
                (await getBlockTimestamp(networkContext)) * 1000 +
                  CREATION_TIMESTAMP_DRIFT_ALLOWED_MS
              ) {
                this.emitError(stream, {
                  code: SarcophagusValidationError.INVALID_TIMESTAMP,
                  message: `${errorMessagePrefix} \n Timestamp received is in the future.  
                  \n Got: ${timestamp}
                  \n Latest block timestamp value: ${await getBlockTimestamp(networkContext)}`,
                });
                return;
              }

              const publicKey = await networkContext.keyFinder.getNextPublicKey();

              // sign sarcophagus parameters to demonstrate agreement
              const signature = await signPacked(
                networkContext.ethWallet,
                ["bytes", "uint256", "uint256", "uint256", "uint256", "uint256"],
                [
                  publicKey,
                  maximumRewrapIntervalBN.toString(),
                  maximumResurrectionTimeBN.toString(),
                  diggingFeePerSecond,
                  Math.trunc(timestamp / 1000).toString(),
                  curseFee,
                ]
              );
              this.streamToBrowser(stream, JSON.stringify({ signature, publicKey }));
            } catch (e) {
              await archLogger.error(e, { logTimestamp: true, sendNotification: true });
              this.emitError(stream, {
                code: SarcophagusValidationError.UNKNOWN_ERROR,
                message: e.code ? `${e.code}\n${e.message}` : e.message ?? e,
              });
            }
          }
        });
      } catch (err) {
        await archLogger.error(`problem with pipe in archaeologist-negotiation-signature: ${err}`, {
          logTimestamp: true,
          sendNotification: true,
          networkContext,
        });
      }
    };

    // Set up separate streams for each chain id
    const web3Interface = getWeb3Interface();
    process.env
      .CHAIN_IDS!.split(",")
      .map(idStr => Number.parseInt(idStr.trim()))
      .forEach(async chainId => {
        this.node.handle([`${NEGOTIATION_SIGNATURE_STREAM}-${chainId}`], async ({ stream }) => {
          _handleNegotiationSignatureStream(
            (await web3Interface).getNetworkContext(chainId),
            { stream }
          );
        });
      });
  }
}
