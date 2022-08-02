import 'dotenv/config'
import { randomArchVals } from './utils/random-arch-gen';
import { Archaeologist } from "./models/archaeologist"
import { getMultiAddresses } from './utils';

const numOfArchsToGenerate = 4
const startingTcpPort = 8000
const startingWsPort = 10000

let archaeologists: Promise<void>[] = []
const { peerId, listenAddresses } = await randomArchVals(startingTcpPort, startingWsPort)

const bootstrap = new Archaeologist({
  name: "bootstrap",
  peerId,
  listenAddresses,
  isBootstrap: true
})

await bootstrap.initNode()

const bootstrapList = getMultiAddresses(bootstrap.node)

for (let i = 0; i < numOfArchsToGenerate; i++) {
  const { peerId, listenAddresses } = await randomArchVals(startingTcpPort + i, startingWsPort + i)
  const arch = new Archaeologist({
    name: `arch${i}`,
    peerId,
    listenAddresses,
    bootstrapList
  })

  archaeologists.push(arch.initNode())
}

await Promise.all(archaeologists)

// const { peerId: id, listenAddresses: addr } = await randomArchVals("9000", "10000");
// const arch = new Archaeologist({
//   name: "arch1",
//   peerId: id,
//   bootstrapList: process.env.BOOTSTRAP_LIST!.split(", "),
//   isBootstrap: false,
//   listenAddresses: addr,
// })
// await arch.initNode()


// const { peerId, listenAddresses } = await randomArchVals("9001", "10001");
// const arch2 = new Archaeologist({
//   name: "arch2",
//   peerId,
//   bootstrapList: process.env.BOOTSTRAP_LIST!.split(", "),
//   isBootstrap: false,
//   listenAddresses,
// })
// await arch2.initNode()

// arch2.node.pubsub.subscribe("test_topic");
// arch2.node.pubsub.addEventListener("message", (data) => console.log(`${arch2.name} got ${data}`));

// console.log("1  -- ", arch.node.pubsub.getTopics());
// console.log("2  -- ", arch2.node.pubsub.getTopics());

// arch.publish("test_topic", "Bird bird bird, bird is the word!").catch(err => {
//   console.error(err)
// })



