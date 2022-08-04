import { Libp2p } from "libp2p";
import { loadPeerIdFromFile } from "../utils";
import { genListenAddresses } from "../utils/listen-addresses";
import { createNode } from "../utils/create-node";
import { NodeConfig } from "./node-config";
import { EnvConfig } from "./env-config";

export interface ListenAddressesConfig {
  ipAddress: string
  tcpPort: string
  wsPort: string
  signalServerList: string[]
}

export interface ArchaeologistInit {
  name: string
  peerId?: any
  listenAddresses?: string[] | undefined
  isBootstrap?: boolean
  listenAddressesConfig?: ListenAddressesConfig
  bootstrapList?: string[]
}

export class Archaeologist {
  public node: Libp2p
  public name: string

  private nodeConfig
  private peerId
  private listenAddresses: string[] | undefined
  private listenAddressesConfig: ListenAddressesConfig | undefined
  public envConfig: EnvConfig;

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

  async initNode(arg: { config: EnvConfig, idFilePath?: string }) {
    this.node = await this.createLibp2pNode(arg.idFilePath)
    this.envConfig = arg.config;

    setInterval(() => this.publishEnvConfig(), 30000)
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
      console.log(err);
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

    return await createNode(this.name, this.nodeConfig.configObj)
  }
}