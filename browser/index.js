import { Buffer } from 'buffer'
globalThis.Buffer = Buffer

import { createLibp2p } from 'libp2p'
import { Noise } from '@chainsafe/libp2p-noise'
import { Mplex } from '@libp2p/mplex'
import { Bootstrap } from '@libp2p/bootstrap'
import { KadDHT } from "@libp2p/kad-dht";
import { WebSockets } from "@libp2p/websockets";
import { WebRTCStar } from '@libp2p/webrtc-star'

if (!import.meta.env.VITE_BOOTSTRAP_NODE_LIST) {
  throw Error("VITE_BOOTSTRAP_NODE_LIST not set in .env")
}

if (!import.meta.env.SIGNAL_SERVER_LIST) {
  throw Error("SIGNAL_SERVER_LIST not set in .env")
}

document.addEventListener("DOMContentLoaded", async () => {
  const dht = new KadDHT({
    protocolPrefix: "/archaeologist-service",
    clientMode: false
  })

  const webRtcStar = new WebRTCStar()

  const libp2p = await createLibp2p({
    addresses: {
      // Add the signaling server address, along with our PeerId to our multiaddrs list
      // libp2p will automatically attempt to dial to the signaling server so that it can
      // receive inbound connections from other peers
      listen: import.meta.env.SIGNAL_SERVER_LIST.split(", ").map(server => {
        return `/dns4/${server}/tcp/443/wss/p2p-webrtc-star`
      })
    },
    transports: [
      new WebSockets(),
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
      new Bootstrap({
        list: process.env.VITE_BOOTSTRAP_NODE_LIST.split(", ")
      }),
    ],
    dht,
    connectionManager: {
      autoDial: true
    }
  })

  const status = document.getElementById("status");
  const output = document.getElementById("output");

  output.textContent = "";

  function log(txt) {
    console.info(txt);
    output.textContent += `${txt.trim()}\n`;
  }

  // Listen for new peers
  libp2p.addEventListener('peer:discovery', (evt) => {
    const peer = evt.detail
    log(`Peer ${libp2p.peerId.toString()} discovered: ${peer.id.toString()}`)
  })

  libp2p.pubsub.addEventListener('message', (evt) => {
    log(`event found: ${evt.detail.data.toString()}`)
  })

  // Listen for peers connecting
  libp2p.connectionManager.addEventListener('peer:connect', (evt) => {
    const peer = evt.detail.remotePeer
    log(`Connection established to: ${peer.toString()}`)
  });


  await libp2p.start();
  log(`libp2p id is ${libp2p.peerId.toString()}`);
});