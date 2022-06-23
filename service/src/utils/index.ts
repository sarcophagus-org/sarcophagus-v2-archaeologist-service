import 'dotenv/config'
import { Libp2p } from "libp2p";
import jsonfile from "jsonfile"
import { createFromJSON } from "@libp2p/peer-id-factory";
import PeerId from "peer-id";

export function getMultiAddresses(node: Libp2p): string[] {
  return node.getMultiaddrs().map((m) => m.toString())
}

export function validateEnvVars() {
  if (!process.env.IP_ADDRESS) {
    throw Error("IP_ADDRESS not set in .env")
  }

  if (!process.env.PORT) {
    throw Error("PORT not set in .env")
  }

  if (!process.env.SIGNAL_SERVER_LIST) {
    throw Error("SIGNAL_SERVER_LIST not set in .env")
  }

  if (!process.env.IS_BOOTSTRAP && !process.env.BOOTSTRAP_LIST) {
    throw Error("BOOTSTRAP_LIST not set in .env")
  }
}

export async function getPeerId() {
  const peerIdFile = './peer-id.json'

  try {
    const peerIdJson = await jsonfile.readFile(peerIdFile)
    console.log(peerIdJson)
    // @ts-ignore
    const test = await createFromJSON(peerIdJson)
    console.log(test)
    return test
  } catch (err) {
    throw Error(`Error loading peer id: ${err}`)
  }
}
