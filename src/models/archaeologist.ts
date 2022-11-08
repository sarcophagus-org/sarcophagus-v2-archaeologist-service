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

export interface ListenAddressesConfig {
  signalServerList: string[];
}

export interface ArchaeologistInit {
  name: string;
  peerId?: PeerId;
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
  }

  async initNode(arg: {
    config: PublicEnvConfig;
    web3Interface: Web3Interface;
    idFilePath?: string;
  }) {
    this.node = await this.createLibp2pNode(arg.idFilePath);
    this.envConfig = arg.config;
    this.web3Interface = arg.web3Interface;

    return this.node;
  }

  async createLibp2pNode(idFilePath?: string): Promise<Libp2p> {
    this.peerId = this.peerId ?? (await loadPeerIdFromFile(idFilePath));

    if (this.listenAddressesConfig) {
      const { signalServerList } = this.listenAddressesConfig!;
      this.listenAddresses = genListenAddresses(
        signalServerList,
        this.peerId.toJSON().id
      );
    }

    this.nodeConfig.add("peerId", this.peerId);
    this.nodeConfig.add("addresses", { listen: this.listenAddresses });

    return createNode(this.name, this.nodeConfig.configObj, connection =>
      this.sendEncryptionPublicKey(connection)
    );
  }

  async shutdown() {
    archLogger.info(`${this.name} is stopping...`);
    await this.node.stop();
  }

  async _setupSarcophagusNegotiationStream() {
    this.node.handle([NEGOTIATION_SIGNATURE_STREAM], async ({ stream }) => {
      const streamToBrowser = (result: string) => {
        pipe([new TextEncoder().encode(result)], stream);
      };

      try {
        await pipe(stream, async source => {
          const emitError = (error: StreamCommsError) => {
            streamToBrowser(JSON.stringify({ error }));
            archLogger.error(`Failed to sign sarcophagus params: ${error.message}`);
          }
          for await (const data of source) {
            // validate that supplied sarcophagus parameters meet the requirements of the archaeologist
            try {
              const {
                arweaveTxId,
                unencryptedShardDoubleHash,
                maxRewrapInterval,
                diggingFee, // this is assumed to, and should, be in wei
                timestamp,
              }: SarcophagusNegotiationParams = JSON.parse(new TextDecoder().decode(data.subarray()));

              const maximumRewrapIntervalBN = BigNumber.from(maxRewrapInterval);
              const errorMessagePrefix = `Archaeologist ${this.peerId.toString()} declined to sign: `;

              if (maximumRewrapIntervalBN.gt(inMemoryStore.profile!.maximumRewrapInterval)) {
                emitError({
                  code: SarcophagusValidationError.MAX_REWRAP_INTERVAL_TOO_LARGE,
                  message: `${errorMessagePrefix} \n Maximum rewrap interval too large.  
                  \n Got: ${maximumRewrapIntervalBN.toString()}
                  \n Maximum allowed: ${inMemoryStore.profile!.maximumRewrapInterval.toString()}`
                });
                return;
              }

              if (ethers.utils.parseEther(diggingFee).lt(inMemoryStore.profile!.minimumDiggingFee)) {
                emitError({
                  code: SarcophagusValidationError.DIGGING_FEE_TOO_LOW,
                  message: `${errorMessagePrefix} \n Digging fee sent is too low.  
                  \n Got: ${diggingFee.toString()}
                  \n Minimum needed: ${inMemoryStore.profile!.minimumDiggingFee.toString()}`
                });
                return;
              }

              if (timestamp > Date.now()) {
                emitError({
                  code: SarcophagusValidationError.INVALID_TIMESTAMP,
                  message: `${errorMessagePrefix} \n Timestamp received is in the future.  
                  \n Got: ${timestamp}
                  \n Date.now value: ${Date.now()}`
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
                emitError({
                  code: SarcophagusValidationError.INVALID_ARWEAVE_SHARD,
                  message: `${errorMessagePrefix} \n Arweave shard is invalid.  
                  \n Arweave TX ID: ${arweaveTxId}
                  \n unencryptedShardDoubleHash value: ${unencryptedShardDoubleHash}`
                });
                return;
              }

              // sign sarcophagus parameters to demonstrate agreement
              const signPacked = async (
                types: string[],
                data: string[],
              ) => {
                const dataHex = ethers.utils.defaultAbiCoder.encode(types, data);
                const dataHash = ethers.utils.keccak256(dataHex);
                const dataHashBytes = ethers.utils.arrayify(dataHash);
                const signature = await this.web3Interface.ethWallet.signMessage(dataHashBytes);
                return signature;
              }

              const signature = await signPacked(
                ["string", "bytes32", "uint256", "uint256", "uint256"],
                [
                  arweaveTxId,
                  unencryptedShardDoubleHash,
                  maximumRewrapIntervalBN.toString(),
                  diggingFee,
                  Math.trunc(timestamp / 1000).toString(),
                ]);
              streamToBrowser(JSON.stringify({ signature }));
            } catch (e) {
              archLogger.error(e);
              emitError({
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

  async sendEncryptionPublicKey(connection) {
    try {
      const signature = await this.web3Interface.ethWallet.signMessage(this.envConfig.encryptionPublicKey);

      const msgStr = JSON.stringify({
        signature,
        encryptionPublicKey: this.envConfig.encryptionPublicKey,
      });

      const stream = await connection.newStream(PUBLIC_KEY_STREAM);

      pipe([new TextEncoder().encode(msgStr)], stream);
    } catch (error) {
      archLogger.error(`Exception sending public key: ${error}\nConnection: ${JSON.stringify(connection)}`);
    }
  }
}
