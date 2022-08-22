import 'dotenv/config'
import { Libp2p } from "libp2p";
import jsonfile from "jsonfile"
import { createFromJSON } from "@libp2p/peer-id-factory";

export function getMultiAddresses(node: Libp2p): string[] {
  return node.getMultiaddrs().map((m) => m.toString())
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
