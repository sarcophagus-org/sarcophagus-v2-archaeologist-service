import { createLibp2p, Libp2p, Libp2pOptions } from "libp2p";
import { archLogger } from "./chalk-theme";
import { setupNodeEventListeners } from "./node-event-listeners";


/**
 *
 * @param name - name of the node, purely for logging purposes
 * @param configOptions - Libp2p config
 * @param connectCallback
 */
export async function createNode(
  name: string,
  configOptions: Libp2pOptions,
  connectCallback: () => void,
): Promise<Libp2p> {
  const node = await createLibp2p(configOptions);
  setupNodeEventListeners(node, name, connectCallback);

  const peerId = node.peerId.toString();
  await node.start();

  archLogger.notice(`${name} started with id: ${peerId.slice(peerId.length - 5)}`);

  return node;
}

