import { TCP } from "@libp2p/tcp";
import { WebSockets } from "@libp2p/websockets";
import { WebRTCStar } from "@libp2p/webrtc-star";
import wrtc from '@koush/wrtc'
import { KadDHT } from "@libp2p/kad-dht";
import { Noise } from "@chainsafe/libp2p-noise";
import { Mplex } from "@libp2p/mplex";
import { Bootstrap } from "@libp2p/bootstrap";
import { Libp2pOptions } from "libp2p";


import { FloodSub } from '@libp2p/floodsub'

interface NodeConfigParams {
  bootstrapList?: string[],
  isBootstrap?: boolean,
  autoDial?: boolean,
}

const PROTOCOL_PREFIX = "/archaeologist-service";
const webRtcStar = new WebRTCStar({ wrtc });

export class NodeConfig {
  public configObj: Libp2pOptions = {
    // There are some type issues in libp2p interfaces
    // which necessitate these ts-ignore statements
    transports: [
      new TCP(),
      // @ts-ignore
      new WebSockets(),
      // @ts-ignore
      webRtcStar,
    ],
    connectionEncryption: [
      new Noise()
    ],
    streamMuxers: [
      new Mplex()
    ],
    dht: new KadDHT({
      protocolPrefix: process.env.DHT_PROTOCOL_PREFIX || PROTOCOL_PREFIX,
      clientMode: false
    }),
    peerDiscovery: [
      webRtcStar.discovery
    ],
    pubsub: new FloodSub({
      enabled: true,
      canRelayMessage: true,
      emitSelf: false
    }),
  }

  constructor(options: NodeConfigParams = {}) {
    if (options.bootstrapList) {
      this.configObj.peerDiscovery!.push(
        new Bootstrap({
          list: options.bootstrapList
        })
      )
    }

    if (options.isBootstrap) {
      this.configObj.relay = {
        enabled: true, // Allows you to dial and accept relayed connections. Does not make you a relay.
        hop: {
          enabled: true // Allows you to be a relay for other peers
        }
      }
    }

    if (options.autoDial) {
      this.configObj.connectionManager = {
        autoDial: true
      }
    }
  }

  public add(key: any, val: any) {
    Object.assign(this.configObj, {
      [key]: val
    })
  }
}