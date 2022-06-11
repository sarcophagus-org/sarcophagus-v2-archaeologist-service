import { createLibp2p, Libp2p } from "libp2p";
import { Noise } from "@chainsafe/libp2p-noise";
import { Mplex } from "@libp2p/mplex";
import { WebRTCDirect } from '@libp2p/webrtc-direct'
import { TCP } from '@libp2p/tcp'
import { createFromJSON } from '@libp2p/peer-id-factory'
import { FloodSub } from '@libp2p/floodsub'
import { PubSubPeerDiscovery } from '@libp2p/pubsub-peer-discovery'
import { WebSockets } from '@libp2p/websockets'
import wrtc from 'wrtc'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';

export default async function createBootstrapNode (listenAddresses: string[], name: string): Promise<Libp2p> {
  const hardcodedPeerId = await createFromJSON({
    "id": "12D3KooWAsxUbeyiTv8zr7iURBh2ugajHK2ZsS8Js4Vu3Q3SrLpA",
    "privKey": "CAESQFqlvz/23BSFbxJUTikH0zLqEm2KbxRvrRcKzdG/D0ZwD8c4qW0YpWvC/DWmlj9ojFY8rxLzhxQgX/5BSEXOdJM=",
    "pubKey": "CAESIA/HOKltGKVrwvw1ppY/aIxWPK8S84cUIF/+QUhFznST"
  })

  const topics = [
    'testytime/_peer-discovery._p2p._pubsub'
  ]

  const node = await createLibp2p({
    peerId: hardcodedPeerId,
    addresses: {
      listen: listenAddresses
    },
    transports: [
      new WebRTCDirect({ wrtc }),
      // new WebSockets()
      // new TCP()
    ],
    connectionEncryption: [
      new Noise()
    ],
    streamMuxers: [
      new Mplex()
    ],
    pubsub: new FloodSub({
      enabled: true,
      canRelayMessage: true,
      emitSelf: false
    }),
    peerDiscovery: [
      new PubSubPeerDiscovery({
        interval: 10000,
        topics: topics, // defaults to ['_peer-discovery._p2p._pubsub']
        listenOnly: false
      })
    ],
    relay: {
      enabled: true, // Allows you to dial and accept relayed connections. Does not make you a relay.
      hop: {
        enabled: true // Allows you to be a relay for other peers
      }
    }
  })

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

  ;console.log(`${name} starting with id: ${node.peerId.toString()}`)

  await node.start()
  return node
}