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
import { fetchAndValidateArweaveShard } from "../utils/arweave";
import { Web3Interface } from "scripts/web3-interface";

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
    await this._setupArweaveStream();
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

    return createNode(this.name, this.nodeConfig.configObj, (connection) => this.publishEnvConfig(connection));
  }

  async shutdown() {
    archLogger.info(`${this.name} is stopping...`)
    await this.node.stop()
  }

  async _setupMessageStream() {
    const msgProtocol = '/message';
    archLogger.info(`listening to stream on protocol: ${msgProtocol}`)
    this.node.handle([msgProtocol], ({ stream }) => {
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
    })
  }

  async _setupArweaveStream() {
    this.node.handle(['/validate-arweave'], async ({ stream }) => {
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
            for await (const data of source) {
              const jsonData = JSON.parse(new TextDecoder().decode(data));

              const txId = jsonData.arweaveTxId;
              const unencryptedShardHash = jsonData.unencryptedShardHash;

              const isValidShard = await fetchAndValidateArweaveShard(txId, unencryptedShardHash, this.web3Interface.encryptionWallet.publicKey);

              if (isValidShard) {
                const msg = ethers.utils.solidityPack(
                  ['string', 'string', 'string'],
                  [txId, unencryptedShardHash, this.web3Interface.ethWallet.address]
                )
                const signature = await this.web3Interface.encryptionWallet.signMessage(msg);

                streamToBrowser(signature);
              } else {
                streamToBrowser('0');
              }
            }
          },
        )
      } catch (err) {
        archLogger.error(`problem with pipe in validate-arweave: ${err}`)
      }
    })
  }

  async publishEnvConfig(connection) {
    const envConfig = {
      encryptionPublicKey: this.envConfig.encryptionPublicKey,
      peerId: this.peerId.toString(),
    };

    const signature = await this.web3Interface.signer.signMessage(JSON.stringify(envConfig));

    const configStr = JSON.stringify({
      signature,
      ...envConfig
    });

    const { stream } = await connection.newStream(`/env-config`);

    pipe(
      [new TextEncoder().encode(configStr)],
      stream,
      async (source) => {
        for await (const data of source) {
          const dataStr = new TextDecoder().decode(data as BufferSource | undefined);
          console.log('dataStr', dataStr);
        }
      }
    );
  }
}