import { createLibp2p, Libp2p, Libp2pOptions } from "libp2p";
import { archLogger } from "../logger/chalk-theme";
import { setupNodeEventListeners } from "./node-event-listeners";

/**
 * Setup and return a libp2p node instance
 * @param name - name of the node, purely for logging purposes
 * @param configOptions - Libp2p config
 */
export async function createAndStartNode(
  name: string,
  configOptions: Libp2pOptions
): Promise<Libp2p> {
  const node = await createLibp2p(configOptions);
  setupNodeEventListeners(node, name);

  const peerId = node.peerId.toString();
  await node.start();

  archLogger.notice(`${name} started with id: ${peerId.slice(peerId.length - 5)}`);

  return node;
}
