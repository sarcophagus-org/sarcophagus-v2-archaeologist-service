import 'dotenv/config'
import { initArchaeologist } from "./init/index.js"
import PeerId from "peer-id"
import { bootstrapListenAddress, genListenAddresses } from "./utils/listen-addresses.js"
import { WebRTCStar } from "@libp2p/webrtc-star";
import wrtc from 'wrtc'

const localhost = '127.0.0.1'
const starServer = 'sig.encryptafile.com'

const bootstrapPeerId = await PeerId.create({ bits: 1024, keyType: 'Ed25519' })
const bootstrapWsPort = 10000
const bootstrapLA = genListenAddresses(localhost, 9090, bootstrapWsPort, [starServer], bootstrapPeerId.toString())

const archOnePeerId = await PeerId.create({ bits: 1024, keyType: 'Ed25519' })
const archOneWsPort = 20000
const archOneLA = genListenAddresses(localhost, 9090, archOneWsPort, [starServer], archOnePeerId.toString())

const archTwoPeerId = await PeerId.create({ bits: 1024, keyType: 'Ed25519' })
const archTwoWsPort = 30000
const archTwoLA = genListenAddresses(localhost, 9090, archTwoWsPort, [starServer], archTwoPeerId.toString())

const webRtcStar = new WebRTCStar({wrtc})

const bootstrap = await initArchaeologist(
  "bootstrap",
  webRtcStar,
  bootstrapPeerId,
  bootstrapLA,
  null
)

const bootstrapList = [bootstrapListenAddress(localhost, bootstrapWsPort, bootstrapPeerId.toString())]

const [arch1, arch2] = await Promise.all([
  initArchaeologist(
    "arch1",
    webRtcStar,
    archOnePeerId,
    archOneLA,
    bootstrapList
  ),
  initArchaeologist(
    "arch2",
    webRtcStar,
    archTwoPeerId,
    archTwoLA,
    bootstrapList
  )
])



