import 'dotenv/config'
import { getMultiAddresses } from "./utils";
import { validateEnvVars } from "./utils/validateEnv";
import { randomArchVals } from "./utils/random-arch-gen.js";
import { Archaeologist } from "./models/archaeologist";
import { Libp2p } from "libp2p";
import { ethers } from 'ethers';
import { getWeb3Interface } from './scripts/web3-interface';

/**
 * This file is used to test multiple archaeologists locally
 * Set numOfArchsToGenerate for how many archaeologists to generate
 */

const numOfArchsToGenerate = 3
const startingTcpPort = 8000
const startingWsPort = 10000
const encryptionWallet = new ethers.Wallet(process.env.ENCRYPTION_PRIVATE_KEY!);

const config = validateEnvVars(true);
let archInitNodePromises: Promise<Libp2p>[] = [];


/**
 * Setup and start Bootstrap Node
 */

const { peerId, listenAddresses } = await randomArchVals(startingTcpPort, startingWsPort)

const bootstrap = new Archaeologist({
  name: "bootstrap",
  peerId,
  listenAddresses,
  isBootstrap: true
})

await bootstrap.initNode({
  config: { encryptionPublicKey: encryptionWallet.publicKey },
  web3Interface: await getWeb3Interface(true),
});


/**
 * Setup and start non-bootstrap nodes
 */

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

  archInitNodePromises.push(arch.initNode({
    config: { encryptionPublicKey: encryptionWallet.publicKey },
    web3Interface: await getWeb3Interface(true),
  }))
  archs.push(arch)
}

await Promise.all(archInitNodePromises);


/**
 * Handle streams for all non-bootstrap nodes
 */

for (let i = 0; i < numOfArchsToGenerate; i++) {
  archs[i].setupIncomingConfigStream()
}



