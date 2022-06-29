import PeerId from "peer-id";
import { genListenAddresses } from "./listen-addresses";

const localhost = '127.0.0.1'
const starServer = 'sig.encryptafile.com'

export const randomArchVals = async (tcpPort, wsPort) => {
  const peerId = await PeerId.create({ bits: 1024, keyType: 'Ed25519' })
  const listenAddresses = genListenAddresses(localhost, tcpPort, wsPort, [starServer], peerId.toJSON().id)
  return { peerId, listenAddresses }
}

