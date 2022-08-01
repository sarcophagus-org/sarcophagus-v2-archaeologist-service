import { Libp2p } from "libp2p";
import { loadPeerIdFromFile } from "../utils";
import { genListenAddresses } from "../utils/listen-addresses";
import { createNode } from "../utils/create-node";
import { NodeConfig } from "./node-config";
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'

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
  public i: number

  private nodeConfig
  private peerId
  private listenAddresses: string[] | undefined
  private listenAddressesConfig: ListenAddressesConfig | undefined

  constructor(options: ArchaeologistInit) {
    if (!options.listenAddresses && !options.listenAddressesConfig) {
      throw Error("Either listenAddresses or listenAddressesConfig must be provided in archaeologist constructor")
    }

    this.nodeConfig = new NodeConfig({
      bootstrapList: options.bootstrapList,
      isBootstrap: options.isBootstrap
    })

    this.i = 0;
    this.name = options.name
    this.peerId = options.peerId
    this.listenAddresses = options.listenAddresses
    this.listenAddressesConfig = options.listenAddressesConfig
  }

  async initNode() {
    this.node = await this.createLibp2pNode()

    const topic = "wow"
    this.node.pubsub.addEventListener("message", (evt) => {
      // Will not receive own published messages by default
      console.log(`${this.name} received a msg: ${new TextDecoder().decode(evt.detail.data)}`)
    })
    this.node.pubsub.subscribe(topic)

    setInterval(() => {
      this.publish(topic, `${this.i} -- ${this.name} says hi!`).catch(err => {
        console.info(err)
      })
    }, 3000)
  }

  async publish(topic: string, msg: string) {
    try {
      const data = new TextEncoder().encode(msg);
      console.log(`${this.i} -- ${this.name} publish msg`);
      await this.node.pubsub.publish(topic, data);
      this.i++
    }
    catch (err) {
      console.log(err);
    }
  }

  async createLibp2pNode(): Promise<Libp2p> {
    this.peerId = this.peerId ?? await loadPeerIdFromFile()

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