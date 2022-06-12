import { Buffer } from 'buffer'
globalThis.Buffer = Buffer

import { createLibp2p } from 'libp2p'
import { WebRTCDirect } from "@libp2p/webrtc-direct"
import { Noise } from '@chainsafe/libp2p-noise'
import { Mplex } from '@libp2p/mplex'
import { Bootstrap } from '@libp2p/bootstrap'
import wrtc from 'wrtc'
import { KadDHT } from "@libp2p/kad-dht";

if (!import.meta.env.VITE_BOOTSTRAP_NODE_LIST) {
  throw Error("VITE_BOOTSTRAP_NODE_LIST not set in .env")
}

console.log("nodelist", import.meta.env.VITE_BOOTSTRAP_NODE_LIST)

document.addEventListener("DOMContentLoaded", async () => {
  const dht = new KadDHT({
    protocolPrefix: "/archaeologist-service",
    clientMode: false
  })

  const libp2p = await createLibp2p({
    transports: [
      new WebRTCDirect({wrtc}),
    ],
    connectionEncryption: [
      new Noise()
    ],
    streamMuxers: [
      new Mplex()
    ],
    peerDiscovery: [
      new Bootstrap({
        list: [import.meta.env.VITE_BOOTSTRAP_NODE_LIST]
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
  status.innerText = "libp2p started!";
  log(`libp2p id is ${libp2p.peerId.toString()}`);
});