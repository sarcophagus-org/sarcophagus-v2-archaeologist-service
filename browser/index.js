import { createLibp2p } from 'libp2p'
import { WebRTCDirect } from "@libp2p/webrtc-direct"
import { Noise } from '@chainsafe/libp2p-noise'
import { Mplex } from '@libp2p/mplex'
import { Bootstrap } from '@libp2p/bootstrap'
import {PubSubPeerDiscovery} from "@libp2p/pubsub-peer-discovery";
import {FloodSub} from "@libp2p/floodsub";
import wrtc from 'wrtc'

document.addEventListener("DOMContentLoaded", async () => {
  const topics = [// It's recommended but not required to extend the global space
    'testytime/_peer-discovery._p2p._pubsub' // Include if you want to participate in the global space
  ]

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
    pubsub: new FloodSub({
      enabled: true,
      canRelayMessage: true,
      emitSelf: false
    }),
    peerDiscovery: [
      new Bootstrap({
        list: [
          `/ip4/127.0.0.1/tcp/9092/http/p2p-webrtc-direct/p2p/12D3KooWAsxUbeyiTv8zr7iURBh2ugajHK2ZsS8Js4Vu3Q3SrLpA`
        ]
      }),
      new PubSubPeerDiscovery({
        interval: 10000,
        topics: topics, // defaults to ['_peer-discovery._p2p._pubsub']
        listenOnly: true
      })
    ],
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
    log('Connection established to:', peer.toString())
  });

  await libp2p.start();
  status.innerText = "libp2p started!";
  log(`libp2p id is ${libp2p.peerId.toString()}`);

  const peers = libp2p.getPeers()
  log(`open peers: ${peers}`)
});