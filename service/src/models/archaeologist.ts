import { Libp2p } from "libp2p";
import { loadPeerIdFromFile } from "../utils";
import { genListenAddresses } from "../utils/listen-addresses";
import { createNode } from "../utils/create-node";
import { NodeConfig } from "./node-config";
import { PublicEnvConfig } from "./env-config";
import { pipe } from "it-pipe";
import { PeerId } from "@libp2p/interfaces/dist/src/peer-id";
import { archLogger } from "../utils/chalk-theme";
import { ethers } from "ethers";
import { fetchAndValidateShardOnArweave } from "../utils/arweave";
import { Web3Interface } from "scripts/web3-interface";
import { inMemoryStore } from "../utils/onchain-data";
import { StreamCommsError, MAX_REWRAP_INTERVAL_TOO_LARGE, UNKNOWN_ERROR } from "../utils/error-codes";

export interface ListenAddressesConfig {
  ipAddress: string
  tcpPort: string
  wsPort: string
  signalServerList: string[]
}

export interface ArchaeologistInit {
  name: string
  peerId?: PeerId
  listenAddresses?: string[] | undefined
  isBootstrap?: boolean
  listenAddressesConfig?: ListenAddressesConfig
  bootstrapList?: string[]
}

interface SarcoDataFromEmbalmerToValidate {
  arweaveTxId: string;
  unencryptedShardDoubleHash: string;
  maxRewrapInterval;
}

export class Archaeologist {
  public node: Libp2p
  public name: string

  private nodeConfig: NodeConfig
  private peerId: PeerId
  private listenAddresses: string[] | undefined
  private listenAddressesConfig: ListenAddressesConfig | undefined
  public envConfig: PublicEnvConfig;
  public web3Interface: Web3Interface;


  constructor(options: ArchaeologistInit) {
    if (!options.listenAddresses && !options.listenAddressesConfig) {
      throw Error("Either listenAddresses or listenAddressesConfig must be provided in archaeologist constructor")
    }

    this.nodeConfig = new NodeConfig({
      bootstrapList: options.bootstrapList,
      isBootstrap: options.isBootstrap
    })

    this.name = options.name
    this.peerId = options.peerId
    this.listenAddresses = options.listenAddresses
    this.listenAddressesConfig = options.listenAddressesConfig
  }

  truncatedId(id, limit = 5): string {
    return id.slice(id.length - limit)
  }

  async setupCommunicationStreams() {
    await this._setupMessageStream();
    await this._setupArweaveSignoffStream();
  }

  async initNode(arg: { config: PublicEnvConfig, web3Interface: Web3Interface, idFilePath?: string }) {
    this.node = await this.createLibp2pNode(arg.idFilePath)
    this.envConfig = arg.config;
    this.web3Interface = arg.web3Interface;

    return this.node;
  }

  async createLibp2pNode(idFilePath?: string): Promise<Libp2p> {
    this.peerId = this.peerId ?? await loadPeerIdFromFile(idFilePath)

    if (this.listenAddressesConfig) {
      const { ipAddress, tcpPort, wsPort, signalServerList } = this.listenAddressesConfig!
      this.listenAddresses = genListenAddresses(
        ipAddress, tcpPort, signalServerList, this.peerId.toJSON().id
      )
    }

    this.nodeConfig.add("peerId", this.peerId)
    this.nodeConfig.add("addresses", { listen: this.listenAddresses })

    return createNode(this.name, this.nodeConfig.configObj, (connection) => this.sendEncryptionPublicKey(connection));
  }

  async shutdown() {
    archLogger.info(`${this.name} is stopping...`)
    await this.node.stop()
  }

  async _setupMessageStream() {
    const msgProtocol = '/message';
    archLogger.info(`listening to stream on protocol: ${msgProtocol}`)
    this.node.handle([msgProtocol], ({ stream }) => {
      try {
        pipe(
          stream,
          async function (source) {
            for await (const msg of source) {
              const decoded = new TextDecoder().decode(msg);
              archLogger.notice(`received message ${decoded}`);
            }
          }
        ).finally(() => {
          stream.close()
        })
      } catch (error) {
        archLogger.error(`Error sending message:\n${error}`);
      }
    })
  }

  async _setupArweaveSignoffStream() {
    this.node.handle(['/arweave-signoff'], async ({ stream }) => {
      const streamToBrowser = (result: string) => {
        pipe(
          [new TextEncoder().encode(result)],
          stream,
        )
      }

      try {
        await pipe(
          stream,
          async (source) => {
            const signOff = (signature: string) => streamToBrowser(JSON.stringify({ signature }));
            const emitError = (error: StreamCommsError) => streamToBrowser(JSON.stringify({ error }));

            const noSignHint = "Declined to sign";

            for await (const data of source) {
              try {
                const {
                  arweaveTxId,
                  unencryptedShardDoubleHash,
                  maxRewrapInterval,
                }: SarcoDataFromEmbalmerToValidate = JSON.parse(new TextDecoder().decode(data));

                if (maxRewrapInterval > inMemoryStore.profile!.maximumRewrapInterval.toNumber()) {
                  emitError({
                    code: MAX_REWRAP_INTERVAL_TOO_LARGE,

                    // offload the burden of user-friendly messaging to the recipient
                    message: noSignHint,
                  });
                  return;
                }

                const isValidShard = await fetchAndValidateShardOnArweave(arweaveTxId, unencryptedShardDoubleHash, this.web3Interface.encryptionWallet.publicKey);

                if (isValidShard) {
                  const msg = ethers.utils.solidityPack(
                    ['string', 'string', 'string'],
                    [arweaveTxId, unencryptedShardDoubleHash, maxRewrapInterval.toString()]
                  )
                  const signature = await this.web3Interface.encryptionWallet.signMessage(msg);

                  signOff(signature);
                } else {
                  emitError({
                    code: MAX_REWRAP_INTERVAL_TOO_LARGE,
                    message: noSignHint,
                  });
                }
              } catch (e) {
                emitError({
                  code: UNKNOWN_ERROR,
                  message: e.code ? `${e.code}\n${e.message}` : (e.message ?? e)
                });
              }
            }
          },
        )
      } catch (err) {
        archLogger.error(`problem with pipe in validate-arweave: ${err}`)
      }
    })
  }

  async sendEncryptionPublicKey(connection) {
    try {
      const message = {
        encryptionPublicKey: this.envConfig.encryptionPublicKey,
        peerId: this.peerId.toString(),
      };

      const signature = await this.web3Interface.ethWallet.signMessage(JSON.stringify(envConfig));

      const msgStr = JSON.stringify({
        signature,
        ...message
      });

      const { stream } = await connection.newStream(`/public-key`);

      pipe(
        [new TextEncoder().encode(msgStr)],
        stream,
        async (source) => {
          for await (const data of source) {
            const dataStr = new TextDecoder().decode(data as BufferSource | undefined);
            console.log('dataStr', dataStr);
          }
        }
      );
    } catch (error) {
      archLogger.error(`Exception sending public key: ${error}\nConnectin: ${connection}`);
    }
  }
}
