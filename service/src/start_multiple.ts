import 'dotenv/config'
import { getMultiAddresses, loadPeerIdFromFile } from "./utils";
import { randomArchVals } from "./utils/random-arch-gen.js";
import { Archaeologist } from "./models/archaeologist";
import { Libp2p } from "libp2p";
import { ethers } from 'ethers';
import { getWeb3Interface } from './scripts/web3-interface';
import { startService } from './start_service';


function randomIntFromInterval(min, max) { // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}

/**
 * This file is used to test multiple archaeologists locally
 * Set numOfArchsToGenerate for how many archaeologists to generate
 */

const numOfArchsToGenerate = 1
const startingTcpPort = randomIntFromInterval(10000, 15000)
const startingWsPort = randomIntFromInterval(15001, 20000)
const bootstrapEncryptionWallet = new ethers.Wallet(process.env.ENCRYPTION_PRIVATE_KEY!);

let archInitNodePromises: Promise<void | Libp2p>[] = [];

/**
 * Setup and start Bootstrap Node
 */

const peerId = await loadPeerIdFromFile();

const { listenAddresses } = await randomArchVals(
  startingTcpPort, startingWsPort
)

const bootstrap = new Archaeologist({
  name: "bootstrap",
  peerId,
  listenAddresses,
  isBootstrap: true
})

await bootstrap.initNode({
  config: { encryptionPublicKey: bootstrapEncryptionWallet.publicKey },
  web3Interface: await getWeb3Interface(true),
});

/**
 * Setup and start non-bootstrap nodes
 */

const bootstrapList = getMultiAddresses(bootstrap.node)

// Nodes will start with this delay between them
const delayIncrement = 2000;
let delay = 0;

for (let i = 1; i <= numOfArchsToGenerate; i++) {
  const { peerId, listenAddresses } = await randomArchVals(startingTcpPort + i, startingWsPort + i)

  archInitNodePromises.push(
    new Promise(resolve => setTimeout(resolve, delay))
      .then(() =>
        startService({
          nodeName: `arch${i}`,
          peerId,
          listenAddresses,
          bootstrapList,
          isTest: true,
        })
      )
  )
  delay += delayIncrement
}

await Promise.all(archInitNodePromises);



