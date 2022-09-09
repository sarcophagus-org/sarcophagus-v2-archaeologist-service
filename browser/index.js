import { Buffer } from 'buffer'
globalThis.Buffer = Buffer

import { createLibp2p } from 'libp2p'
import { nodeConfig } from "./utils/node-config";
import { pipe } from "it-pipe";
import { log } from "./utils/log";

if (!import.meta.env.VITE_BOOTSTRAP_NODE_LIST) {
  throw Error("VITE_BOOTSTRAP_NODE_LIST not set in .env")
}

if (!import.meta.env.VITE_SIGNAL_SERVER_LIST) {
  throw Error("VITE_SIGNAL_SERVER_LIST not set in .env")
}

function truncatedId(id, limit = 5) {
  return id.slice(id.length - limit)
}

document.addEventListener("DOMContentLoaded", async () => {
  const browserNode = await createLibp2p(nodeConfig);
  const nodeId = browserNode.peerId.toString()

  log(`starting browser node with id: ${truncatedId(nodeId)}`)
  await browserNode.start()

  const messageInput = document.getElementById("message");
  const discoveredPeers = [];

  // Send text entered into input to connections
  messageInput.addEventListener("change", async (event) => {
    console.log("all connections:", browserNode.getConnections().map(conn => conn.toString()))
    for(let peer of browserNode.getConnections()) {
      try {
        log(`attempting to send message ${event.target.value} to /message/${truncatedId(peer.remotePeer.toString())}`)

        // console.log(JSON.stringify(peer.))
        const { stream } = await peer.newStream(`/message/${truncatedId(peer.remotePeer.toString())}`)
        await pipe(
          [new TextEncoder().encode(event.target.value)],
          stream
        )
      } catch (err) {
        log(`Error in peer ${peer.remotePeer.toString()} setting up message outbound stream: ${err}`)
      }
    }
  });

  // Log discovered peers
  browserNode.addEventListener('peer:discovery', (evt) => {
    const peerId = evt.detail.id.toString();

    if (discoveredPeers.find((p) => p === peerId) === undefined) {
      discoveredPeers.push(peerId);
      log(`${truncatedId(nodeId)} discovered: ${truncatedId(peerId)}`)
    }
  })

  // Log connected peers
  browserNode.connectionManager.addEventListener('peer:connect', async (evt) => {
    const peerId = evt.detail.remotePeer.toString();
    log(`Connection established to: ${truncatedId(peerId)}`)
  });

  // Log disconnected peers
  browserNode.connectionManager.addEventListener('peer:disconnect', async (evt) => {
    const peerId = evt.detail.remotePeer.toString();
    log(`Connection dropped from: ${truncatedId(peerId)}`)
  });

  // Unload connections when browser closes (this may not be necessary)
  window.addEventListener("beforeunload",  (e) => {
    browserNode.connectionManager.closeConnections()
  });
});