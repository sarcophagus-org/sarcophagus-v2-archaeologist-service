import { createLibp2p, Libp2p } from "libp2p";
import { Noise } from "@chainsafe/libp2p-noise";
import { Mplex } from "@libp2p/mplex";
import { WebRTCDirect } from '@libp2p/webrtc-direct'
import { Bootstrap } from '@libp2p/bootstrap'
import wrtc from 'wrtc'
import { KadDHT } from "@libp2p/kad-dht";
import type { PeerId } from '@libp2p/interfaces/peer-id';

const PROTOCOL_PREFIX = "/archaeologist-service"

interface NodeConfigOptions {
  listenAddresses?: string[]
  peerId?: PeerId
  bootstrapList?: string[]
  autoDial?: boolean
  isRelay?: boolean
}

export async function createNode(
  name: string,
  configOptions: NodeConfigOptions
): Promise<Libp2p> {
  /*
    DHT serves as peer discovery mechanism
   */
  const dht = new KadDHT({
    protocolPrefix: PROTOCOL_PREFIX,
    clientMode: false
  })

  /*
    Config Defaults
   */
  const libP2pConfig = {
    transports: [
      new WebRTCDirect({ wrtc }),
    ],
    connectionEncryption: [
      new Noise()
    ],
    streamMuxers: [
      new Mplex()
    ],
    dht
  }

  /*
    Set static peer ID (otherwise will be dynamic whenever node starts)
   */
  if (configOptions.peerId) {
    Object.assign(libP2pConfig, {
      peerId: configOptions.peerId,
    })
  }

  /*
    Full multiaddress that node is listening on
   */
  if (configOptions.listenAddresses) {
    Object.assign(libP2pConfig, {
      addresses: {
        listen: configOptions.listenAddresses
      },
    })
  }

  /*
    Bootstrap nodes to connect to on startup
   */
  if (configOptions.bootstrapList) {
    Object.assign(libP2pConfig, {
      peerDiscovery: [
        new Bootstrap({
          list: configOptions.bootstrapList
        }),
      ],
    })
  }

  /*
    Auto-connect to discovered nodes
   */
  if (configOptions.autoDial) {
    Object.assign(libP2pConfig, {
      connectionManager: {
        autoDial: configOptions.autoDial
      }
    })
  }

  /*
    Whether to relay messages to other peers
    Used by bootstrap node
   */
  if (configOptions.isRelay) {
    Object.assign(libP2pConfig, {
      relay: {
        enabled: true, // Allows you to dial and accept relayed connections. Does not make you a relay.
        hop: {
          enabled: true // Allows you to be a relay for other peers
        }
      }
    })
  }

  const node = await createLibp2p(libP2pConfig)
  setupNodeEventListeners(node, name)

  ;console.log(`${name} starting with id: ${node.peerId.toString()}`)

  await node.start()
  return node
}

function setupNodeEventListeners(node: Libp2p, name: string) {
  node.addEventListener('peer:discovery', (evt) => {
    const peer = evt.detail
    console.log(`${name} discovered: ${peer.id.toString()}`)
  })

  node.connectionManager.addEventListener('peer:connect', (evt) => {
    const peer = evt.detail.remotePeer
    console.log(`${name} Connection established to:`, peer.toString())
  })

  node.connectionManager.addEventListener('peer:disconnect', (evt) => {
    const peer = evt.detail.remotePeer
    console.log(`${name} Connection dropped from:`, peer.toString())
  })
}