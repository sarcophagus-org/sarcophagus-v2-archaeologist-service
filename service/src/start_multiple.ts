import 'dotenv/config'
import { randomTestArchVals } from "./utils/random-arch-gen.js";
import { Libp2p } from "libp2p";
import { startService } from './start_service';


function randomIntFromInterval(min, max) { // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}

/**
 * This file is used to run multiple archaeologists locally
 * Set numOfArchsToGenerate for how many archaeologists to generate
 */

const numOfArchsToGenerate = 2
const startingTcpPort = randomIntFromInterval(10000, 15000)
const startingWsPort = randomIntFromInterval(15001, 20000)

let archInitNodePromises: Promise<void | Libp2p>[] = [];

// Nodes will start with this delay between them
const delayIncrement = 2000;
let delay = 0;

for (let i = 1; i <= numOfArchsToGenerate; i++) {
  const { peerId, listenAddresses } = await randomTestArchVals({
    tcpPort: startingTcpPort + i,
    wsPort: startingWsPort + i
  })

  archInitNodePromises.push(
    new Promise(resolve => setTimeout(resolve, delay))
      .then(() =>
        startService({
          nodeName: `arch${i}`,
          peerId,
          listenAddresses,
          isTest: true,
        })
      )
  )
  delay += delayIncrement
}

await Promise.all(archInitNodePromises);



