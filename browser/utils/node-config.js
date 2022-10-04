import {KadDHT} from "@libp2p/kad-dht";
import {WebRTCStar} from "@libp2p/webrtc-star";
import {Noise} from "@chainsafe/libp2p-noise";
import {Mplex} from "@libp2p/mplex";

const dht = new KadDHT({
  protocolPrefix: "/archaeologist-service",
  clientMode: false
})

const webRtcStar = new WebRTCStar();

export const nodeConfig = {
  addresses: {
    // Add the signaling server address, along with our PeerId to our multiaddrs list
    // libp2p will automatically attempt to dial to the signaling server so that it can
    // receive inbound connections from other peers
    listen: import.meta.env.VITE_SIGNAL_SERVER_LIST.split(",").map(s => s.trim()).map(server => {
      return `/dns4/${server}/tcp/443/wss/p2p-webrtc-star`
    })
  },
  transports: [
    webRtcStar
  ],
  connectionEncryption: [
    new Noise()
  ],
  streamMuxers: [
    new Mplex()
  ],
  peerDiscovery: [
    webRtcStar.discovery,
  ],
  dht,
  connectionManager: {
    autoDial: true
  }
}