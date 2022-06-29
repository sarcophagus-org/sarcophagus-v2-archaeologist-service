import 'dotenv/config'
import { createNode } from "../utils/create-node.js"
import { TCP } from "@libp2p/tcp"
import { WebSockets } from "@libp2p/websockets"
import { WebRTCStar } from '@libp2p/webrtc-star'
import wrtc from 'wrtc'
import { getPeerId, validateEnvVars } from "../utils/index.js";
import { Libp2p } from "libp2p";
import { genListenAddresses } from "../utils/listen-addresses.js"

type BootstrapList = string[] | null | undefined

const isBootstrapNode = (bootstrapList: BootstrapList) => {
  return bootstrapList === null || process.env.IS_BOOTSTRAP
}

export const initArchaeologist = async (
  name: string,
  peer?: any,
  addresses?: string[],
  bootstraps?: BootstrapList
): Promise<Libp2p> => {

  validateEnvVars()

  const peerId = peer ?? await getPeerId()

  const listenAddresses = addresses ?? genListenAddresses(
    process.env.IP_ADDRESS!,
    process.env.TCP_PORT!,
    process.env.WS_PORT!,
    process.env.SIGNAL_SERVER_LIST!.split(", "),
    peerId.toJSON().id
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
      /*
        Optional
       */
      // autoDial: true,
    }

  if (bootstrapList) {
    Object.assign(nodeConfig,  {
      bootstrapList
    })
  }

  // If this is a bootstrap node, turn on relay functionality
  if (isBootstrapNode(bootstraps)) {
    Object.assign(nodeConfig,  {
      isRelay: true
    })
  }

  return createNode(
    name,
    nodeConfig
  )
}



