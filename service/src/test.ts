import 'dotenv/config'
import { getMultiAddresses } from "./utils";
import { randomArchVals } from "./utils/random-arch-gen.js";
import { Archaeologist } from "./models/archaeologist";

/**
 * This file is used to test multiple archaeologists locally
 * Set numOfArchsToGenerate for how many archaeologists to generate
 */

const numOfArchsToGenerate = 1
const startingTcpPort = 8101
const startingWsPort = 10801

let archaeologists: { initPromise: Promise<void>, node: Archaeologist }[] = []

const { peerId, listenAddresses } = await randomArchVals(startingTcpPort, startingWsPort)

const bootstrap = new Archaeologist({
  name: "bootstrap",
  peerId,
  listenAddresses,
  isBootstrap: true
})

await bootstrap.initNode()

const bootstrapList = getMultiAddresses(bootstrap.node)

for (let i = 1; i <= numOfArchsToGenerate; i++) {
  const { peerId, listenAddresses } = await randomArchVals(startingTcpPort + i, startingWsPort + i)
  const arch = new Archaeologist({
    name: `arch${i}`,
    peerId,
    listenAddresses,
    bootstrapList
  })

  archaeologists.push({ initPromise: arch.initNode(), node: arch })
}

await Promise.all(archaeologists.map(async p => {
  await p.initPromise;
  p.node.subscribe("test_topic", () => console.log("got msg"))
}));

bootstrap.publish("test_topic", "pls work");


// await Promise.all(archaeologists).then(async _ => {
//   await Promise.all(archs.map(node =>
//     node.subscribe("test_topic", () => console.log("got msg"))
//   ));
//   bootstrap.publish("test_topic", "pls work");
// })




