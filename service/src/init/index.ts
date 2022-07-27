import 'dotenv/config'
import { createNode } from "../utils/create-node"
import { TCP } from "@libp2p/tcp"
import { WebSockets } from "@libp2p/websockets"
import { WebRTCStar } from '@libp2p/webrtc-star'
import wrtc from '@koush/wrtc'
import { loadPeerIdFromFile, validateEnvVars } from "../utils";
import { Libp2p } from "libp2p";
import { genListenAddresses } from "../utils/listen-addresses.js"

const isBootstrapNode = (bootstrapList: BootstrapList) => {
  return bootstrapList === null || process.env.IS_BOOTSTRAP
}

type BootstrapList = string[] | null | undefined

export const initArchaeologist = async (
  name: string,
  peer?: any,
  addresses?: string[],
  bootstraps?: BootstrapList
): Promise<Libp2p> => {

  validateEnvVars()

  const peerId = peer ?? await loadPeerIdFromFile()

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
    // Required
    transports: [
      new TCP(),
      new WebSockets(),
      new WebRTCStar({ wrtc }),
    ],
    listenAddresses,
    // Optional
    // autoDial: true,
  }

  if (bootstrapList) {
    Object.assign(nodeConfig, {
      bootstrapList
    })
  }

  // If this is a bootstrap node, turn on relay functionality
  if (isBootstrapNode(bootstraps)) {
    Object.assign(nodeConfig, {
      isRelay: true
    })
  }

  return createNode(
    name,
    nodeConfig
  )
}



