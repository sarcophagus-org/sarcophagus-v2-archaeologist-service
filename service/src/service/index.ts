import { createLibp2p, Libp2p } from "libp2p";
import { Noise } from "@chainsafe/libp2p-noise";
import { Mplex } from "@libp2p/mplex";
import { KadDHT } from '@libp2p/kad-dht'
import { WebRTCDirect } from '@libp2p/webrtc-direct'
import wrtc from 'wrtc'

async function createNode (listenAddresses: string[]): Promise<Libp2p> {
  return createLibp2p({
    addresses: {
      listen: listenAddresses
    },
    transports: [
      new WebRTCDirect({ wrtc })
    ],
    connectionEncryption: [
      new Noise()
    ],
    streamMuxers: [
      new Mplex()
    ],
  })
}

const LISTEN_ADDRESSES = ['/ip4/127.0.0.1/tcp/9091/http/p2p-webrtc-direct']

const [arch1] = await Promise.all([
  createNode(LISTEN_ADDRESSES),
])

arch1.addEventListener('peer:discovery', (evt) => {
  const peer = evt.detail
  console.log(`Peer ${arch1.peerId.toString()} discovered: ${peer.id.toString()}`)
})

arch1.connectionManager.addEventListener('peer:connect', (evt) => {
  const peer = evt.detail.remotePeer
  console.log('Connection established to:', peer.toString())
})

;[arch1].forEach((node, index) =>  {
  console.log(`Node ${index} starting with id: ${node.peerId.toString()}`)
})

await Promise.all([
  arch1.start(),
])