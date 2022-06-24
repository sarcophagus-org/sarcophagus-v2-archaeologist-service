import 'dotenv/config'
import { createNode } from "../utils/create-node.js"
import { TCP } from "@libp2p/tcp"
import { WebSockets } from "@libp2p/websockets"
import { WebRTCStar } from '@libp2p/webrtc-star'
import wrtc from 'wrtc'
import { getPeerId, validateEnvVars } from "../utils/index.js";
import { Libp2p } from "libp2p";
import { genListenAddresses } from "../utils/listen-addresses.js"

export const initArchaeologist = async (
  name: string,
  webRtcStar: any,
  peer?: any,
  addresses?: string[],
  bootstraps?: string[] | null
): Promise<Libp2p> => {
  validateEnvVars()
  const peerId = peer ?? await getPeerId()

  const listenAddresses = addresses ?? genListenAddresses(
    process.env.IP_ADDRESS!,
    process.env.TCP_PORT!,
    process.env.WS_PORT!,
    process.env.SIGNAL_SERVER_LIST!.split(", "),
    peerId.toString()
  )

  const bootstrapList = bootstraps === null ?
    undefined :
    bootstraps ?? process.env.BOOTSTRAP_LIST!.split(", ")

  const nodeConfig =
    {
      transports: [
        new TCP(),
        new WebSockets(),
        new WebRTCStar({wrtc}),
      ],
      listenAddresses,
      autoDial: true
    }

  if (bootstrapList) {
    Object.assign(nodeConfig,  {
      bootstrapList
    })
  }

  console.log(nodeConfig)

  return createNode(
    name,
    nodeConfig
  )
}



