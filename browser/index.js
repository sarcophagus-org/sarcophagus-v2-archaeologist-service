import { createLibp2p } from 'libp2p'
import { WebRTCDirect } from "@libp2p/webrtc-direct"
import { Noise } from '@chainsafe/libp2p-noise'
import { Mplex } from '@libp2p/mplex'
import { Bootstrap } from '@libp2p/bootstrap'

document.addEventListener("DOMContentLoaded", async () => {
  const hardcodedPeerId =
    "12D3KooWBrnHPxQMBR8ZBBPU7LsoxzkC8DSQndG2ZyGXSvetFJ3v";
  const libp2p = await createLibp2p({
    transports: [
      new WebRTCDirect()
    ],
    connectionEncryption: [
      new Noise()
    ],
    streamMuxers: [
      new Mplex()
    ],
    peerDiscovery: [
      new Bootstrap({
        list: [
          `/ip4/127.0.0.1/tcp/9091/http/p2p-webrtc-direct/p2p/${hardcodedPeerId}`
        ]
      })
    ],
    connectionManager: {
      autoDial: true, // Auto connect to discovered peers (limited by ConnectionManager minConnections)
      // The `tag` property will be searched when creating the instance of your Peer Discovery service.
      // The associated object, will be passed to the service when it is instantiated.
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

  // Listen for peers connecting
  libp2p.connectionManager.addEventListener('peer:connect', (evt) => {
    const peer = evt.detail.remotePeer
    log('Connection established to:', peer.toString())
  });

  await libp2p.start();
  status.innerText = "libp2p started!";
  log(`libp2p id is ${libp2p.peerId.toString()}`);

  const peers = libp2p.getPeers()
  log(`open peers: ${peers}`)
});