import PeerId from "peer-id";
import { genListenAddresses } from "./listen-addresses";
import { createFromJSON } from "@libp2p/peer-id-factory";

const localhost = '127.0.0.1'
const starServers = process.env.SIGNAL_SERVER_LIST

export const randomArchVals = async (tcpPort, wsPort) => {
  const randomPeerId = await PeerId.create({ bits: 1024, keyType: 'Ed25519' })
  const peerIdJson = randomPeerId.toJSON()
  const peerId = await createFromJSON(peerIdJson)
  const listenAddresses = genListenAddresses(localhost, tcpPort, wsPort, [starServers!], peerIdJson.id)
  return { peerId, listenAddresses }
}

