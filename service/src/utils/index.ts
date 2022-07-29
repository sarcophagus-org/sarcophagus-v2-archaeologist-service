import 'dotenv/config'
import { Libp2p } from "libp2p";
import jsonfile from "jsonfile"
import { createFromJSON } from "@libp2p/peer-id-factory";

export function getMultiAddresses(node: Libp2p): string[] {
  return node.getMultiaddrs().map((m) => m.toString())
}

export function validateEnvVars() {
  if (!process.env.IP_ADDRESS) {
    throw Error("IP_ADDRESS not set in .env")
  }

  if (!process.env.TCP_PORT) {
    throw Error("TCP_PORT not set in .env")
  }

  if (!process.env.WS_PORT) {
    throw Error("WS_PORT not set in .env")
  }

  if (!process.env.SIGNAL_SERVER_LIST) {
    throw Error("SIGNAL_SERVER_LIST not set in .env")
  }

  if (!process.env.IS_BOOTSTRAP && !process.env.BOOTSTRAP_LIST) {
    throw Error("BOOTSTRAP_LIST not set in .env")
  }
}

export async function loadPeerIdFromFile(idFilePath?: string) {
  const peerIdFile = idFilePath ?? './peer-id.json'

  try {
    const peerIdJson = await jsonfile.readFile(peerIdFile)
    const peerId = createFromJSON(peerIdJson)

    if (!peerId) {
      throw Error("Could not load peer ID. Please make sure peer-id.json file exists in root directory")
    }

    return peerId
  } catch (err) {
    throw Error(`Error loading peer id: ${err}. Try running "npm run peer-id-gen" first`)
  }
}
