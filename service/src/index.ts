import 'dotenv/config'
import { createNode } from "./utils/create-node.js";
import { createFromJSON } from "@libp2p/peer-id-factory";
import { TCP } from "@libp2p/tcp";
import { WebSockets } from "@libp2p/websockets";
import { WebRTCStar } from '@libp2p/webrtc-star'
import { sigServer } from '@libp2p/webrtc-star-signalling-server'
import wrtc from 'wrtc'

if (!process.env.IP_ADDRESS) {
  throw Error("IP_ADDRESS not set in .env")
}

if (!process.env.PORT) {
  throw Error("PORT not set in .env")
}

const webRtcStar = new WebRTCStar({wrtc})

// const server = await sigServer({
//   port: 24642,
//   host: '127.0.0.1',
//   metrics: false
// })

// const LISTEN_ADDRESS = [`/ip4/${process.env.IP_ADDRESS}/tcp/${process.env.PORT}/http/p2p-webrtc-direct`]
const LISTEN_ADDRESSES_BOOTSTRAP = ['/ip4/127.0.0.1/tcp/0', '/ip4/127.0.0.1/tcp/10000/ws']
const LISTEN_ADDRESSES_ARCH1 = [
  '/dns4/sig.encryptafile.com/tcp/443/wss/p2p-webrtc-star/p2p/12D3KooWSA9etgtvd83GtyMu4eRf9j7DYfHuhannPA6A8EwGQnXf',
]
// const LISTEN_ADDRESSES_ARCH2 = [
//   '/dns4/sig.encryptafile.com/tcp/443/wss/p2p-webrtc-star/p2p/12D3KooWNpowJDDNtG5zJsh9BhJAJkVSRuqieP8rD1E6DhpV9oei',
// ]

const archOnePeerId = await createFromJSON({
  "id": "12D3KooWSA9etgtvd83GtyMu4eRf9j7DYfHuhannPA6A8EwGQnXf",
  "privKey": "CAESQL4Z8tRevg/+9h7sJFuTu3ALbxP38I1QTHHA9paiU3ff8sx04wsRudYJBrOIFakcbzawq+ksEXy9JzktU6rATU4=",
  "pubKey": "CAESIPLMdOMLEbnWCQaziBWpHG82sKvpLBF8vSc5LVOqwE1O"
})

const archTwoPeerId = await createFromJSON({
  "id": "12D3KooWNpowJDDNtG5zJsh9BhJAJkVSRuqieP8rD1E6DhpV9oei",
  "privKey": "CAESQJJrtXg1aRmuByrvHw8dQa18cC1yjUQeHdaEd+HofgoQwUUQ8dw0RZ42AOUXhr9Gw8eiaTH0y6JbtFUdOs8vm2M=",
  "pubKey": "CAESIMFFEPHcNEWeNgDlF4a/RsPHomkx9MuiW7RVHTrPL5tj"
})

const bootstrapPeerId = await createFromJSON({
  "id": "12D3KooWAsxUbeyiTv8zr7iURBh2ugajHK2ZsS8Js4Vu3Q3SrLpA",
  "privKey": "CAESQFqlvz/23BSFbxJUTikH0zLqEm2KbxRvrRcKzdG/D0ZwD8c4qW0YpWvC/DWmlj9ojFY8rxLzhxQgX/5BSEXOdJM=",
  "pubKey": "CAESIA/HOKltGKVrwvw1ppY/aIxWPK8S84cUIF/+QUhFznST"
})

// const [bootstrap] = await Promise.all([
//   createNode(
//     "bootstrap",
//     {
//       transports: [
//         new TCP(),
//         new WebSockets(),
//       ],
//       peerId: bootstrapPeerId,
//       listenAddresses: LISTEN_ADDRESSES_BOOTSTRAP,
//       autoDial: true,
//       isRelay: true
//     }
//   )
// ])

const [arch1] = await Promise.all([
  createNode(
    "arch1",
    {
      transports: [
        webRtcStar,
        new WebSockets()
      ],
      peerId: archOnePeerId,
      listenAddresses: LISTEN_ADDRESSES_ARCH1,
      // bootstrapList: ['/ip4/127.0.0.1/tcp/10000/ws/p2p/12D3KooWAsxUbeyiTv8zr7iURBh2ugajHK2ZsS8Js4Vu3Q3SrLpA'],
      autoDial: true
    }
  ),
  // createNode(
  //   "arch2",
  //   {
  //     transports: [
  //       webRtcStar,
  //       new WebSockets()
  //     ],
  //     peerId: archTwoPeerId,
  //     listenAddresses: LISTEN_ADDRESSES_ARCH2,
  //     // bootstrapList: ['/ip4/127.0.0.1/tcp/10000/ws/p2p/12D3KooWAsxUbeyiTv8zr7iURBh2ugajHK2ZsS8Js4Vu3Q3SrLpA'],
  //     autoDial: true
  //   }
  // )
])



