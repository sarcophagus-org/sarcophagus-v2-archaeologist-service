import 'dotenv/config'
import { createNode } from "./utils/create-node.js";
import { createFromJSON } from "@libp2p/peer-id-factory";

if (!process.env.IP_ADDRESS) {
  throw Error("IP_ADDRESS not set in .env")
}

if (!process.env.PORT) {
  throw Error("PORT not set in .env")
}

const LISTEN_ADDRESS = [`/ip4/${process.env.IP_ADDRESS}/tcp/${process.env.PORT}/http/p2p-webrtc-direct`]

if (process.env.BOOTSTRAP_LIST) {
  const [arch1] = await Promise.all([
    createNode(
      "arch1",
      {
        listenAddresses: LISTEN_ADDRESS,
        bootstrapList: [process.env.BOOTSTRAP_LIST],
        autoDial: true
      }
    )
  ])
} else {
  /*
    If we don't have a bootstrap list, this is a bootstrap node
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
        listenAddresses: LISTEN_ADDRESS,
        autoDial: true,
        isRelay: true
      }
    )
  ])
}



