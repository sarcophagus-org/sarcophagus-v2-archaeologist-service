import { Buffer } from 'buffer'
import { pushable } from "it-pushable";
globalThis.Buffer = Buffer

import { createLibp2p } from 'libp2p'
import { Noise } from '@chainsafe/libp2p-noise'
import { Mplex } from '@libp2p/mplex'
import { Bootstrap } from '@libp2p/bootstrap'
import { KadDHT } from "@libp2p/kad-dht";
import { WebSockets } from "@libp2p/websockets";
import { WebRTCStar } from '@libp2p/webrtc-star';

import { FloodSub } from '@libp2p/floodsub'
import { pipe } from "it-pipe";
import { solidityKeccak256 } from "ethers/lib/utils";

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
    addresses: {
      // Add the signaling server address, along with our PeerId to our multiaddrs list
      // libp2p will automatically attempt to dial to the signaling server so that it can
      // receive inbound connections from other peers
      listen: import.meta.env.VITE_SIGNAL_SERVER_LIST.split(",").map(s => s.trim()).map(server => {
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
        list: import.meta.env.VITE_BOOTSTRAP_NODE_LIST.split(",").map(s => s.trim())
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

  const fileInput = document.getElementById("file-input");
  const output = document.getElementById("output");
  const idTruncateLimit = 5;

  fileInput.addEventListener("change", (evt) => {
    const file = fileInput.files[0];

    const reader = new FileReader();

    reader.addEventListener('load', (event) => {
      const fileData = event.target.result;

      const outboundStream = pushable({});

      console.log("browser hashed", solidityKeccak256(["string"], [fileData]));

      outboundStream.push(new TextEncoder().encode(fileData));


      void Promise.resolve().then(async () => {
        try {
          const { stream } = await selectedArweaveConn.newStream('/get-file/1.0.0')
          pipe(
            outboundStream,
            stream
          )
        } catch (err) {
          log(`Error in peer conn listener: ${err}`)
        }
      })
    });

    reader.readAsDataURL(file);
  });

  output.textContent = "";

  const discoveredPeers = [];

  const nodeId = browserNode.peerId.toString()
  log(`starting browser node with id: ${nodeId.slice(nodeId.length - idTruncateLimit)}`)
  await browserNode.start()

  let selectedArweaveConn;

  // Listen for new peers
  browserNode.addEventListener('peer:discovery', (evt) => {
    const peerId = evt.detail.id.toString();

    if (discoveredPeers.find((p) => p === peerId) === undefined) {
      discoveredPeers.push(peerId);
      log(`${nodeId.slice(nodeId.length - idTruncateLimit)} discovered: ${peerId.slice(peerId.length - idTruncateLimit)}`)
    }
  })


  // Listen for peers connecting
  browserNode.connectionManager.addEventListener('peer:connect', async (evt) => {
    // in actual app, will need to track all connected nodes, and set this value
    // based on user input
    selectedArweaveConn = evt.detail;

    const peerId = evt.detail.remotePeer.toString();
    log(`Connection established to: ${peerId.slice(peerId.length - idTruncateLimit)}`)
  });

  browserNode.pubsub.addEventListener('message', (evt) => {
    const msg = new TextDecoder().decode(evt.detail.data)
    const sourceId = evt.detail.from.toString();
    log(`from ${sourceId.slice(sourceId.length - idTruncateLimit)}: ${msg}`)
  })

  browserNode.pubsub.subscribe("env-config")
});