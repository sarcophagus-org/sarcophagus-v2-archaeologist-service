import 'dotenv/config'
import { initArchaeologist } from "./init"
import { getMultiAddresses } from "./utils";
import { randomArchVals } from "./utils/random-arch-gen.js";
import { Libp2p } from "libp2p";

/**
 * This file is used to test multiple archaeologists locally
 * Set numOfArchsToGenerate for how many archaeologists to generate
 */

const numOfArchsToGenerate = 4
const startingTcpPort = 8000
const startingWsPort = 10000

let archaeologists: Promise<Libp2p>[] = []
const { peerId, listenAddresses } = await randomArchVals(startingTcpPort, startingWsPort)
const bootstrap = await initArchaeologist(
  "bootstrap",
  peerId,
  listenAddresses,
  null
)

const bootstrapList = getMultiAddresses(bootstrap)

for(let i = 0; i < numOfArchsToGenerate; i++) {
  const { peerId, listenAddresses } = await randomArchVals(startingTcpPort + i, startingWsPort + i)
  archaeologists.push(
    initArchaeologist(
      `arch${i}`,
      peerId,
      listenAddresses,
      bootstrapList
    )
  )
}

await Promise.all(archaeologists)



