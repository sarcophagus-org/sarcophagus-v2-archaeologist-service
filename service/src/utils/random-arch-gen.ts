import PeerId from "peer-id";
import { genListenAddresses } from "./listen-addresses";
import { createFromJSON } from "@libp2p/peer-id-factory";

const localhost = '127.0.0.1'
const starServers = process.env.SIGNAL_SERVER_LIST

export const randomArchVals = async (tcpPort: string | number, number, existingPeerId?) => {
  let peerIdJson, peerId
  if (!existingPeerId) {
    const randomPeerId = await PeerId.create({ bits: 1024, keyType: 'Ed25519' })
    peerIdJson = randomPeerId.toJSON()
    peerId = await createFromJSON(peerIdJson)
  } else {
    peerId = existingPeerId
    peerIdJson = peerId.toJSON()
  }

  const listenAddresses = genListenAddresses(localhost, tcpPort, [starServers!], peerIdJson.id)
  return { peerId, listenAddresses }
}

