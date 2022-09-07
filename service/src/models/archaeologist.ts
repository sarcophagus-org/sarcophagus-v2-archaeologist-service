import { Libp2p } from "libp2p";
import { loadPeerIdFromFile } from "../utils";
import { genListenAddresses } from "../utils/listen-addresses";
import { createNode } from "../utils/create-node";
import { NodeConfig } from "./node-config";
import { PublicEnvConfig } from "./env-config";
import { pipe } from "it-pipe";
import { solidityKeccak256 } from "ethers/lib/utils";
import { PeerId } from "@libp2p/interfaces/dist/src/peer-id";
import { archLogger } from "../utils/chalk-theme";
import { ethers, Wallet } from "ethers";
import { fetchAndValidateArweaveShard } from "../utils/arweave";
import { pushable } from "it-pushable";

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
  public encryptionWallet: Wallet;

  public envTopic = "env-config";

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

  async setupIncomingConfigStream() {
    // TODO: Do we need this get-file protocol anymore?
    this.node.handle(['/get-file/1.0.0'], async ({ stream }) => {
      try {
        await pipe(stream, async (source) => {
          for await (const data of source) {
            const decoded = new TextDecoder().decode(data);
            const hashed = solidityKeccak256(["string"], [decoded]);

            console.log("arch hashed", hashed);
          }
        })
      } catch (err) {
        console.log("problem with pipe", err)
      }
    });

    this.node.handle(['/validate-arweave'], async ({ stream }) => {
      try {
        const streamToBrowser = (result: string) => {
          const outboundStream = pushable({})
          outboundStream.push(new TextEncoder().encode(result))
          pipe(
            outboundStream,
            stream
          )
        }

        await pipe(stream, async (source) => {
          for await (const data of source) {
            const jsonData = JSON.parse(new TextDecoder().decode(data));

            const txId = jsonData.arweaveTxId;
            const unencryptedShardHash = jsonData.unencryptedShardHash;

            const isValidShard = await fetchAndValidateArweaveShard(txId, unencryptedShardHash, this.encryptionWallet.publicKey);

            if (isValidShard) {
              const msg = ethers.utils.solidityPack(['string', 'string'], [txId, unencryptedShardHash])
              const signature = await this.encryptionWallet.signMessage(msg);

              streamToBrowser(signature);
            } else {
              streamToBrowser('0');
            }
          }
        })
      } catch (err) {
        console.log("problem with pipe", err)
      }
    })
  }

  async initNode(arg: { config: PublicEnvConfig, encryptionWallet: Wallet, idFilePath?: string }) {
    this.node = await this.createLibp2pNode(arg.idFilePath)
    this.envConfig = arg.config;
    this.encryptionWallet = arg.encryptionWallet;

    return this.node;
  }

  async publishEnvConfig() {
    const configStr = JSON.stringify(this.envConfig);
    this.publish(this.envTopic, configStr).catch(err => {
      console.info(err)
    })
  }

  async publish(topic: string, msg: string) {
    try {
      const data = new TextEncoder().encode(msg);
      await this.node.pubsub.publish(topic, data);
    }
    catch (err) {
      archLogger.error(err);
    }
  }

  async createLibp2pNode(idFilePath?: string): Promise<Libp2p> {
    this.peerId = this.peerId ?? await loadPeerIdFromFile(idFilePath)

    if (this.listenAddressesConfig) {
      const { ipAddress, tcpPort, wsPort, signalServerList } = this.listenAddressesConfig!
      this.listenAddresses = genListenAddresses(
        ipAddress, tcpPort, wsPort, signalServerList, this.peerId.toJSON().id
      )
    }

    this.nodeConfig.add("peerId", this.peerId)
    this.nodeConfig.add("addresses", { listen: this.listenAddresses })

    return createNode(this.name, this.nodeConfig.configObj, () => setTimeout(() => this.publishEnvConfig(), 400));
  }
}