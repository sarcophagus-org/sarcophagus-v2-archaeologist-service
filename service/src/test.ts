import 'dotenv/config'
import { getMultiAddresses } from "./utils";
import { validateEnvVars } from "./utils/validateEnv";
import { randomArchVals } from "./utils/random-arch-gen.js";
import { Archaeologist } from "./models/archaeologist";
import { Libp2p } from "libp2p";
import { ethers } from 'ethers';

/**
 * This file is used to test multiple archaeologists locally
 * Set numOfArchsToGenerate for how many archaeologists to generate
 */

const numOfArchsToGenerate = 4
const startingTcpPort = 8000
const startingWsPort = 10000

const config = validateEnvVars(true);

let archInitNodePromises: Promise<Libp2p>[] = [];
const { peerId, listenAddresses } = await randomArchVals(startingTcpPort, startingWsPort)

const encryptionWallet = new ethers.Wallet(process.env.ENCRYPTION_PRIVATE_KEY!);

const bootstrap = new Archaeologist({
  name: "bootstrap",
  peerId,
  listenAddresses,
  isBootstrap: true
})

await bootstrap.initNode({ config, encryptionWallet })

const bootstrapList = getMultiAddresses(bootstrap.node)
const archs: Archaeologist[] = []

for (let i = 1; i <= numOfArchsToGenerate; i++) {
  const { peerId, listenAddresses } = await randomArchVals(startingTcpPort + i, startingWsPort + i)
  const arch = new Archaeologist({
    name: `arch${i}`,
    peerId,
    listenAddresses,
    bootstrapList
  })

  archInitNodePromises.push(arch.initNode({ config, encryptionWallet }))
  archs.push(arch)
}

await Promise.all(archInitNodePromises);

for (let i = 0; i < numOfArchsToGenerate; i++) {
  archs[i].setupIncomingConfigStream()
}



