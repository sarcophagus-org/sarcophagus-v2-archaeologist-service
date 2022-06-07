import { createLibp2p, Libp2p } from "libp2p";
import { TCP } from '@libp2p/tcp'
import { Noise } from "@chainsafe/libp2p-noise";
import { Mplex } from "@libp2p/mplex";

async function createNode (listenAddresses: string[]): Promise<Libp2p> {
  return createLibp2p({
    addresses: {
      listen: listenAddresses
    },
    transports: [
      new TCP()
    ],
    connectionEncryption: [
      new Noise()
    ],
    streamMuxers: [
      new Mplex()
    ]
  })
}

async function startNode(node: Libp2p) {
  await node.start()
  console.log('node has started (true/false):', node.isStarted())

  console.log('listening on:')

  node.getMultiaddrs().forEach((ma) => console.log(`${ma.toString()}`))

  await node.stop()
  console.log('libp2p has stopped')
}

const LISTEN_ADDRESSES = ['/ip4/0.0.0.0/tcp/8000']
const archaeologist = await createNode(LISTEN_ADDRESSES)
startNode(archaeologist)