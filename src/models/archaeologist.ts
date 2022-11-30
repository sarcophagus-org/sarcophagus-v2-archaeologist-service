import { Libp2p } from "libp2p";
import { loadPeerIdFromFile } from "../utils";
import { genListenAddresses } from "../utils/listen-addresses";
import { createNode } from "../utils/create-node";
import { NodeConfig } from "./node-config";
import { PublicEnvConfig } from "./env-config";
import { pipe } from "it-pipe";
import { PeerId } from "@libp2p/interfaces/dist/src/peer-id";
import { archLogger } from "../logger/chalk-theme";
import { BigNumber, ethers } from "ethers";
import { fetchAndValidateShardOnArweave } from "../utils/arweave";
import { Web3Interface } from "scripts/web3-interface";
import { PUBLIC_KEY_STREAM, NEGOTIATION_SIGNATURE_STREAM } from "./node-config";
import { inMemoryStore } from "../utils/onchain-data";
import { SarcophagusValidationError, StreamCommsError } from "../utils/error-codes";
import type { Stream } from "@libp2p/interface-connection";

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
  arweaveTxId: string;
  unencryptedShardDoubleHash: string;
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
  public envConfig: PublicEnvConfig;
  public web3Interface: Web3Interface;

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

  async setupCommunicationStreams() {
    await this._setupSarcophagusNegotiationStream();
    await this._setupPublicKeyStream();
  }

  async initNode(arg: { config: PublicEnvConfig; web3Interface: Web3Interface }) {
    if (this.listenAddressesConfig) {
      const { signalServerList } = this.listenAddressesConfig!;
      this.listenAddresses = genListenAddresses(signalServerList, this.peerId.toJSON().id);
    }

    this.nodeConfig.add("peerId", this.peerId);
    this.nodeConfig.add("addresses", { listen: this.listenAddresses });

    this.node = await createNode(this.name, this.nodeConfig.configObj);

    this.envConfig = arg.config;
    this.web3Interface = arg.web3Interface;

    return this.node;
  }

  async shutdown() {
    archLogger.info(`${this.name} is stopping...`);
    await this.node.stop();
  }

  streamToBrowser(stream: Stream, message: string) {
    pipe([new TextEncoder().encode(message)], stream);
  }

  emitError(stream: Stream, error: StreamCommsError) {
    this.streamToBrowser(stream, JSON.stringify({ error }));
    archLogger.error(`Error: ${error.message}`);
  }

  async _setupSarcophagusNegotiationStream() {
    this.node.handle([NEGOTIATION_SIGNATURE_STREAM], async ({ stream }) => {
      try {
        await pipe(stream, async source => {
          for await (const data of source) {
            // validate that supplied sarcophagus parameters meet the requirements of the archaeologist
            try {
              const {
                arweaveTxId,
                unencryptedShardDoubleHash,
                maxRewrapInterval,
                diggingFee, // this is assumed to, and should, be in wei
                timestamp,
              }: SarcophagusNegotiationParams = JSON.parse(
                new TextDecoder().decode(data.subarray())
              );

              const maximumRewrapIntervalBN = BigNumber.from(maxRewrapInterval);
              const errorMessagePrefix = `Archaeologist ${this.peerId.toString()} declined to sign: `;

              if (maximumRewrapIntervalBN.gt(inMemoryStore.profile!.maximumRewrapInterval)) {
                this.emitError(stream, {
                  code: SarcophagusValidationError.MAX_REWRAP_INTERVAL_TOO_LARGE,
                  message: `${errorMessagePrefix} \n Maximum rewrap interval too large.  
                  \n Got: ${maximumRewrapIntervalBN.toString()}
                  \n Maximum allowed: ${inMemoryStore.profile!.maximumRewrapInterval.toString()}`,
                });
                return;
              }

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

              if (
                !(await fetchAndValidateShardOnArweave(
                  arweaveTxId,
                  unencryptedShardDoubleHash,
                  this.web3Interface.encryptionWallet.publicKey
                ))
              ) {
                this.emitError(stream, {
                  code: SarcophagusValidationError.INVALID_ARWEAVE_SHARD,
                  message: `${errorMessagePrefix} \n Arweave shard is invalid.  
                  \n Arweave TX ID: ${arweaveTxId}
                  \n unencryptedShardDoubleHash value: ${unencryptedShardDoubleHash}`,
                });
                return;
              }

              // sign sarcophagus parameters to demonstrate agreement
              const signPacked = async (types: string[], data: string[]) => {
                const dataHex = ethers.utils.defaultAbiCoder.encode(types, data);
                const dataHash = ethers.utils.keccak256(dataHex);
                const dataHashBytes = ethers.utils.arrayify(dataHash);
                const signature = await this.web3Interface.ethWallet.signMessage(dataHashBytes);
                return signature;
              };

              const signature = await signPacked(
                ["string", "bytes32", "uint256", "uint256", "uint256"],
                [
                  arweaveTxId,
                  unencryptedShardDoubleHash,
                  maximumRewrapIntervalBN.toString(),
                  diggingFee,
                  Math.trunc(timestamp / 1000).toString(),
                ]
              );
              this.streamToBrowser(stream, JSON.stringify({ signature }));
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

  async _setupPublicKeyStream() {
    this.node.handle([PUBLIC_KEY_STREAM], async ({ stream }) => {
      try {
        await pipe(stream, async source => {
          for await (const data of source) {
            if (data.length > 8) stream.close();
            try {
              const signature = await this.web3Interface.ethWallet.signMessage(
                this.envConfig.encryptionPublicKey
              );

              this.streamToBrowser(
                stream,
                JSON.stringify({
                  signature,
                  encryptionPublicKey: this.envConfig.encryptionPublicKey,
                })
              );
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
        archLogger.error(`problem with pipe in public key stream: ${err}`);
      }
    });
  }
}
