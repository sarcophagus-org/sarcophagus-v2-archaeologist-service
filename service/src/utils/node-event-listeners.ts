import { Libp2p } from "libp2p/dist/src";
import { archLogger } from "./chalk-theme";

const idTruncateLimit = 5;

// <nodeName>:<peerId>[]
const discoveredPeers: string[] = [];

function formatDP(name, peerId) {
  return `${name}:${peerId}`;
}

export function setupNodeEventListeners(
  node: Libp2p,
  name: string,
  connectCallback?: (connection) => void
) {
  node.addEventListener("peer:discovery", evt => {
    const peerId = evt.detail.id.toString();
    const formattedPeerId = formatDP(name, peerId);

    if (discoveredPeers.find(p => p === formattedPeerId) === undefined) {
      discoveredPeers.push(formattedPeerId);
      archLogger.info(`${name}: discovered ${peerId.slice(peerId.length - idTruncateLimit)}`);
    }
  });

  node.connectionManager.addEventListener("peer:connect", async evt => {
    const peerId = evt.detail.remotePeer.toString();
    archLogger.info(
      `${name}: Connection established to ${peerId.slice(peerId.length - idTruncateLimit)}`
    );

    if (connectCallback) {
      connectCallback(evt.detail);
    }
  });

  node.connectionManager.addEventListener("peer:disconnect", evt => {
    const peerId = evt.detail.remotePeer.toString();
    archLogger.info(
      `${name}: Connection dropped from ${peerId.slice(peerId.length - idTruncateLimit)}`
    );
  });
}
