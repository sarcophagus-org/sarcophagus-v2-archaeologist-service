import { Libp2p } from "libp2p/dist/src";
import { archLogger } from "./chalk-theme";

const idTruncateLimit = 5;

const discoverPeers: string[] = [];

export function setupNodeEventListeners(
    node: Libp2p,
    name: string,
    connectCallback: () => void,
) {
    node.addEventListener('peer:discovery', (evt) => {
        const peerId = evt.detail.id.toString();

        if (discoverPeers.find((p) => p === peerId) === undefined) {
            discoverPeers.push(peerId);
            archLogger.info(`${name}: discovered ${peerId.slice(peerId.length - idTruncateLimit)}`)
        }
    })

    node.connectionManager.addEventListener('peer:connect', async (evt) => {
        const peerId = evt.detail.remotePeer.toString()
        archLogger.info(`${name}: Connection established to ${peerId.slice(peerId.length - idTruncateLimit)}`);

        connectCallback();
    })

    node.connectionManager.addEventListener('peer:disconnect', (evt) => {
        const peerId = evt.detail.remotePeer.toString()
        archLogger.info(`${name}: Connection dropped from ${peerId.slice(peerId.length - idTruncateLimit)}`)
    })

    node.pubsub.addEventListener("message", (evt) => {
        const topic = new TextDecoder().decode(evt.detail.topic);
        const msg = new TextDecoder().decode(evt.detail.data);

        processMessage(topic, msg);
    })
}

function processMessage(topic, msg) {
    archLogger.info(`${this.name} received a msg on topic ${topic}: ${msg}`);
    switch (msg.topic) {
        case "some-topic":
            break;

        default:
            break;
    }
}