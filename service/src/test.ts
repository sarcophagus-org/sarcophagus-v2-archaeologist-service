import 'dotenv/config'
import { getMultiAddresses, validateEnvVars } from "./utils";
import { randomArchVals } from "./utils/random-arch-gen.js";
import { Archaeologist } from "./models/archaeologist";

/**
 * This file is used to test multiple archaeologists locally
 * Set numOfArchsToGenerate for how many archaeologists to generate
 */

const numOfArchsToGenerate = 4
const startingTcpPort = 8000
const startingWsPort = 10000

const config = validateEnvVars();

let archaeologists: Promise<void>[] = []
const { peerId, listenAddresses } = await randomArchVals(startingTcpPort, startingWsPort)

const bootstrap = new Archaeologist({
  name: "bootstrap",
  peerId,
  listenAddresses,
  isBootstrap: true
})

await bootstrap.initNode({ config })

const bootstrapList = getMultiAddresses(bootstrap.node)

for (let i = 0; i < numOfArchsToGenerate; i++) {
  const { peerId, listenAddresses } = await randomArchVals(startingTcpPort + i, startingWsPort + i)
  const arch = new Archaeologist({
    name: `arch${i}`,
    peerId,
    listenAddresses,
    bootstrapList
  })

  archaeologists.push(arch.initNode({ config }))
}

await Promise.all(archaeologists)



