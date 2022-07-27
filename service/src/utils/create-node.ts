import { createLibp2p, Libp2p, Libp2pOptions } from "libp2p"

/**
 *
 * @param name - name of the node, purely for logging purposes
 * @param configOptions - Libp2p config
 *
 */
export async function createNode(
  name: string,
  // There are some type issues in libp2p interfaces
  // which prevent this from being typed as Libp2pOptions
  configOptions: any
): Promise<Libp2p> {
  console.log(configOptions)
  const node = await createLibp2p(configOptions)
  setupNodeEventListeners(node, name);

  console.log(`${name} starting with id: ${node.peerId.toString()}`)

  await node.start()
  return node
}

function setupNodeEventListeners(node: Libp2p, name: string) {
  node.addEventListener('peer:discovery', (evt) => {
    const peer = evt.detail
    console.log(`${name} discovered: ${peer.id.toString()}`)
  })

  node.connectionManager.addEventListener('peer:connect', (evt) => {
    const peer = evt.detail.remotePeer
    console.log(`${name} Connection established to:`, peer.toString())
  })

  node.connectionManager.addEventListener('peer:disconnect', (evt) => {
    const peer = evt.detail.remotePeer
    console.log(`${name} Connection dropped from:`, peer.toString())
  })
}