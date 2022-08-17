import { createLibp2p, Libp2p, Libp2pOptions } from "libp2p";

const idTruncateLimit = 5;

/**
 *
 * @param name - name of the node, purely for logging purposes
 * @param configOptions - Libp2p config
 *
 */
export async function createNode(
  name: string,
  configOptions: Libp2pOptions,
  connectCallback: () => void,
): Promise<Libp2p> {
  // console.log(configOptions)
  const node = await createLibp2p(configOptions)
  setupNodeEventListeners(node, name, connectCallback);

  const peerId = node.peerId.toString();
  console.log(`${name} starting with id: ${peerId.slice(peerId.length - idTruncateLimit)}`)

  await node.start();
  return node;
}

const discoverPeers: string[] = [];

function setupNodeEventListeners(
  node: Libp2p,
  name: string,
  connectCallback: () => void,
) {
  node.addEventListener('peer:discovery', (evt) => {
    const peerId = evt.detail.id.toString();

    if (discoverPeers.find((p) => p === peerId) === undefined) {
      discoverPeers.push(peerId);
      console.log(`${name}: discovered ${peerId.slice(peerId.length - idTruncateLimit)}`)
    }
  })

  node.connectionManager.addEventListener('peer:connect', async (evt) => {
    const peerId = evt.detail.remotePeer.toString()
    console.log(`${name}: Connection established to`, peerId.slice(peerId.length - idTruncateLimit));

    connectCallback();
  })

  node.connectionManager.addEventListener('peer:disconnect', (evt) => {
    const peerId = evt.detail.remotePeer.toString()
    console.log(`${name}: Connection dropped from`, peerId.slice(peerId.length - idTruncateLimit))
  })

  node.pubsub.addEventListener("message", (evt) => {
    console.log(`${this.name} received a msg: ${new TextDecoder().decode(evt.detail.data)}`)
  })
}