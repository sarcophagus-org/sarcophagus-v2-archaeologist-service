import 'dotenv/config'
import { createNode } from "./utils/create-node.js";
import { TCP } from "@libp2p/tcp";
import { WebSockets } from "@libp2p/websockets";
import { WebRTCStar } from '@libp2p/webrtc-star'
import wrtc from 'wrtc'
import { getPeerId, validateEnvVars } from "./utils/index.js";

validateEnvVars()
const peerId = await getPeerId();

if (!peerId) {
  throw Error("Could not load peer ID. Please make sure peer-id.json file exists in root directory")
}

const webRtcStar = new WebRTCStar({wrtc})

const LISTEN_ADDRESSES = [
  `/ip4/${process.env.IP_ADDRESS}/tcp/${process.env.TCP_PORT}`,
  `/ip4/${process.env.IP_ADDRESS}/tcp/${process.env.WS_PORT}/ws`
].concat(
  process.env.SIGNAL_SERVER_LIST!.split(", ").map(server => {
    return `/dns4/${server}/tcp/443/wss/p2p-webrtc-star/p2p/${peerId.toString()}`
  })
)

const nodeConfig =
  {
    transports: [
      new TCP(),
      new WebSockets(),
      webRtcStar,
    ],
    peerId,
    listenAddresses: LISTEN_ADDRESSES,
    autoDial: true
  }

if (process.env.BOOTSTRAP_LIST) {
  Object.assign(nodeConfig,  {
    bootstrapList: process.env.BOOTSTRAP_LIST!.split(", ")
  })
}

const [arch] = await Promise.all([
  createNode(
    "archaeologist",
    nodeConfig
  )
])

console.log("node listening on: ", LISTEN_ADDRESSES)



