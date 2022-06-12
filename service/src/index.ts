import 'dotenv/config'
import { createNode } from "./utils/create-node.js";
import { createFromJSON } from "@libp2p/peer-id-factory";

if (!process.env.IP_ADDRESS) {
  throw Error("IP_ADDRESS not set in .env")
}

if (!process.env.PORT) {
  throw Error("PORT not set in .env")
}

// TODO: Multiple nodes setup here for testing. Eventually will be a single node
const LISTEN_ADDRESS_BOOTSTRAP = [`/ip4/${process.env.IP_ADDRESS}/tcp/9092/http/p2p-webrtc-direct`]
const LISTEN_ADDRESS_ARCH1 = [`/ip4/${process.env.IP_ADDRESS}/tcp/9091/http/p2p-webrtc-direct`]
const LISTEN_ADDRESS_ARCH2 = [`/ip4/${process.env.IP_ADDRESS}/tcp/9090/http/p2p-webrtc-direct`]

/**
 * Create bootstrap relay node
 */
const bootstrapPeerId = await createFromJSON({
  "id": "12D3KooWAsxUbeyiTv8zr7iURBh2ugajHK2ZsS8Js4Vu3Q3SrLpA",
  "privKey": "CAESQFqlvz/23BSFbxJUTikH0zLqEm2KbxRvrRcKzdG/D0ZwD8c4qW0YpWvC/DWmlj9ojFY8rxLzhxQgX/5BSEXOdJM=",
  "pubKey": "CAESIA/HOKltGKVrwvw1ppY/aIxWPK8S84cUIF/+QUhFznST"
})

const [bootstrap] = await Promise.all([
  createNode(
    "bootstrap",
    {
      peerId: bootstrapPeerId,
      listenAddresses: LISTEN_ADDRESS_BOOTSTRAP,
      autoDial: true,
      isRelay: true
    }
  )
])

/**
 * Create archaeologist nodes
 */
const bootstrapMultiaddrs = bootstrap.getMultiaddrs().map((m) => m.toString())

const [arch1, arch2] = await Promise.all([
  createNode(
    "arch1",
    {
      listenAddresses: LISTEN_ADDRESS_ARCH1,
      bootstrapList: bootstrapMultiaddrs,
      autoDial: true
    }
  ),
  createNode(
    "arch2",
    {
      listenAddresses: LISTEN_ADDRESS_ARCH2,
      bootstrapList: bootstrapMultiaddrs,
      autoDial: true
    }
  ),
])

