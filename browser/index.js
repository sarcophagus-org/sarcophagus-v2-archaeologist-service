import { Buffer } from 'buffer'
globalThis.Buffer = Buffer

import { createLibp2p } from 'libp2p'
import { Noise } from '@chainsafe/libp2p-noise'
import { Mplex } from '@libp2p/mplex'
import { Bootstrap } from '@libp2p/bootstrap'
import { KadDHT } from "@libp2p/kad-dht";
import { WebSockets } from "@libp2p/websockets";
import { WebRTCStar } from '@libp2p/webrtc-star';

import { FloodSub } from '@libp2p/floodsub'

if (!import.meta.env.VITE_BOOTSTRAP_NODE_LIST) {
  throw Error("VITE_BOOTSTRAP_NODE_LIST not set in .env")
}

if (!import.meta.env.VITE_SIGNAL_SERVER_LIST) {
  throw Error("VITE_SIGNAL_SERVER_LIST not set in .env")
}

document.addEventListener("DOMContentLoaded", async () => {
  function log(txt) {
    console.info(txt);
    output.textContent += `${txt.trim()}\n`;
  }

  const dht = new KadDHT({
    protocolPrefix: "/archaeologist-service",
    clientMode: false
  })

  const webRtcStar = new WebRTCStar();

  const config = {
    name: "browserNode",
    addresses: {
      // Add the signaling server address, along with our PeerId to our multiaddrs list
      // libp2p will automatically attempt to dial to the signaling server so that it can
      // receive inbound connections from other peers
      listen: import.meta.env.VITE_SIGNAL_SERVER_LIST.split(", ").map(server => {
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
        list: import.meta.env.VITE_BOOTSTRAP_NODE_LIST.split(", ")
      }),
    ],
    dht,
    connectionManager: {
      autoDial: true
    },
    pubsub: new FloodSub({
      enabled: true,
      canRelayMessage: true,
      emitSelf: false
    }),
  };

  const browserNode = await createLibp2p(config);

  const status = document.getElementById("status");
  const output = document.getElementById("output");

  output.textContent = "";

  const discoverPeers = [];

  await browserNode.start()

  // Listen for new peers
  browserNode.addEventListener('peer:discovery', (evt) => {
    const peer = evt.detail

    if (discoverPeers.find((p) => p === peer) === undefined) {
      discoverPeers.push(peer);
      log(`Peer ${browserNode.peerId.toString()} discovered: ${peer.id.toString()}`)
    }
  })

  browserNode.pubsub.addEventListener('message', (evt) => {
    log(`Received a msg: ${new TextDecoder().decode(evt.detail.data)}`)
  })

  // Listen for peers connecting
  browserNode.connectionManager.addEventListener('peer:connect', (evt) => {
    const peer = evt.detail.remotePeer
    log(`Connection established to: ${peer.toString()}`)
  });

  const topic = "wow"
  browserNode.pubsub.subscribe(topic)
});