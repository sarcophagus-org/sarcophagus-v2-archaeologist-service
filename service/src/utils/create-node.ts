import { createLibp2p, Libp2p, Libp2pOptions } from "libp2p";
import all from 'it-all'
import { pipe } from 'it-pipe'

import { WebRTCDirect } from '@libp2p/webrtc-direct'
import { Multiaddr } from '@multiformats/multiaddr'

const idTruncateLimit = 5;

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
  // console.log(configOptions)
  const node = await createLibp2p(configOptions)
  setupNodeEventListeners(node, name);

  const peerId = node.peerId.toString();
  console.log(`${name} starting with id: ${peerId.slice(peerId.length - idTruncateLimit)}`)

  await node.start();
  return node;
}

const discoverPeers: string[] = [];

function setupNodeEventListeners(node: Libp2p, name: string) {
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

    ////

    const ECHO_PROTOCOL = '/echo/1.0.0'
    const addr = new Multiaddr('/ip4/127.0.0.1/tcp/8999/http/p2p-webrtc-direct')
    const webRTCDirect = new WebRTCDirect()

    const upgrader = {
      upgradeOutbound: async (maConn) => maConn,
      upgradeInbound: async (maConn) => maConn,
    };

    const listener = webRTCDirect.createListener({
      handler: (connection) => {
        console.log('new connection opened')

        connection.newStream([ECHO_PROTOCOL])
          .then(({ stream }) => {
            void pipe(stream, stream)
          })
      },
      // @ts-ignore
      upgrader,
    })

    console.log('listening')
    await listener.listen(addr)
    console.log('listening')

    const connection = await webRTCDirect.dial(addr, {
      // @ts-ignore
      upgrader
    })
    const { stream } = await connection.newStream([ECHO_PROTOCOL])
    const values: any = await pipe(
      [new TextEncoder().encode('hello')],
      stream,
      (source) => all(source)
    )
    console.log(`Value: ${new TextDecoder().decode(values[0])}`)

    // Close connection after reading
    await listener.close()
  })

  node.connectionManager.addEventListener('peer:disconnect', (evt) => {
    const peerId = evt.detail.remotePeer.toString()
    console.log(`${name}: Connection dropped from`, peerId.slice(peerId.length - idTruncateLimit))
  })

  node.pubsub.addEventListener("message", (evt) => {
    console.log(`${this.name} received a msg: ${new TextDecoder().decode(evt.detail.data)}`)
  })
}