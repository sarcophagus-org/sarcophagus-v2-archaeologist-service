import { Libp2p } from "libp2p";
import { genListenAddresses } from "../utils/listen-addresses";
import { createAndStartNode } from "../utils/create-and-start-node";
import { NodeConfig } from "./node-config";
import { pipe } from "it-pipe";
import { PeerId } from "@libp2p/interfaces/dist/src/peer-id";
import { archLogger } from "../logger/chalk-theme";
import { BigNumber, ethers } from "ethers";
import { Web3Interface } from "scripts/web3-interface";
import { NEGOTIATION_SIGNATURE_STREAM } from "./node-config";
import { inMemoryStore } from "../utils/onchain-data";
import { SarcophagusValidationError, StreamCommsError } from "../utils/error-codes";
import type { Stream } from "@libp2p/interface-connection";
import { KeyFinder } from "./key-finder";
import { signPacked } from "../utils/signature";

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
  web3Interface: Web3Interface;
}

interface SarcophagusNegotiationParams {
  maxRewrapInterval: number;
  diggingFee: string;
  timestamp: number;
}

export class Archaeologist {
  public node: Libp2p;
  public name: string;

  private nodeConfig: NodeConfig;
  private peerId: PeerId;
  private listenAddresses: string[] | undefined;
  private listenAddressesConfig: ListenAddressesConfig | undefined;
  public web3Interface: Web3Interface;

  constructor(
    options: ArchaeologistInit
  ) {
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
    this.web3Interface = options.web3Interface;
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
    archLogger.info(`${this.name} is stopping...`);
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

    archLogger.info('node restarting on set interval');
    await this.node.stop();
    await this.node.start();
  }

  streamToBrowser(stream: Stream, message: string) {
    pipe([new TextEncoder().encode(message)], stream);
  }

  emitError(stream: Stream, error: StreamCommsError) {
    this.streamToBrowser(stream, JSON.stringify({ error }));
    archLogger.error(`Error: ${error.message}`);
  }

  async setupSarcophagusNegotiationStream() {
    const errorMessagePrefix = `Archaeologist ${this.peerId.toString()} declined to sign: `;

    this.node.handle([NEGOTIATION_SIGNATURE_STREAM], async ({ stream }) => {
      try {
        await pipe(stream, async source => {
          for await (const data of source) {
            // validate that supplied sarcophagus parameters meet the requirements of the archaeologist
            try {
              const {
                maxRewrapInterval,
                diggingFee, // this is assumed to, and should, be in wei
                timestamp,
              }: SarcophagusNegotiationParams = JSON.parse(
                new TextDecoder().decode(data.subarray())
              );

              const maximumRewrapIntervalBN = BigNumber.from(maxRewrapInterval);

              /**
               * Validate maxRewrapInterval supplied is in line with our maxRewrapInterval
               */
              if (maximumRewrapIntervalBN.gt(inMemoryStore.profile!.maximumRewrapInterval)) {
                this.emitError(stream, {
                  code: SarcophagusValidationError.MAX_REWRAP_INTERVAL_TOO_LARGE,
                  message: `${errorMessagePrefix} \n Maximum rewrap interval too large.  
                  \n Got: ${maximumRewrapIntervalBN.toString()}
                  \n Maximum allowed: ${inMemoryStore.profile!.maximumRewrapInterval.toString()}`,
                });
                return;
              }

              /**
               * Validate supplied digging fee is sufficient
               */
              if (
                ethers.utils.parseEther(diggingFee).lt(inMemoryStore.profile!.minimumDiggingFee)
              ) {
                this.emitError(stream, {
                  code: SarcophagusValidationError.DIGGING_FEE_TOO_LOW,
                  message: `${errorMessagePrefix} \n Digging fee sent is too low.  
                  \n Got: ${diggingFee.toString()}
                  \n Minimum needed: ${inMemoryStore.profile!.minimumDiggingFee.toString()}`,
                });
                return;
              }

              /**
               * Validate negotiation timestamp is within 1 minute of when we received this request
               */
              if (timestamp > Date.now() + 1000 * 60) {
                // add 60 second buffer to account for differences in system times
                this.emitError(stream, {
                  code: SarcophagusValidationError.INVALID_TIMESTAMP,
                  message: `${errorMessagePrefix} \n Timestamp received is in the future.  
                  \n Got: ${timestamp}
                  \n Date.now value: ${Date.now()}`,
                });
                return;
              }

              const publicKey = await this.web3Interface.keyFinder.getNextPublicKey();

              // sign sarcophagus parameters to demonstrate agreement
              const signature = await signPacked(
                this.web3Interface.ethWallet,
                ["bytes", "uint256", "uint256", "uint256"],
                [
                  publicKey,
                  maximumRewrapIntervalBN.toString(),
                  diggingFee,
                  Math.trunc(timestamp / 1000).toString(),
                ]
              );
              this.streamToBrowser(stream, JSON.stringify({ signature, publicKey }));
            } catch (e) {
              archLogger.error(e);
              this.emitError(stream, {
                code: SarcophagusValidationError.UNKNOWN_ERROR,
                message: e.code ? `${e.code}\n${e.message}` : e.message ?? e,
              });
            }
          }
        });
      } catch (err) {
        archLogger.error(`problem with pipe in archaeologist-negotiation-signature: ${err}`);
      }
    });
  }
}
