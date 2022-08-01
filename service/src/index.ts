import 'dotenv/config'
import { Archaeologist } from "./models/archaeologist"
import { getMultiAddresses, validateEnvVars } from "./utils";

validateEnvVars()

const arch = new Archaeologist({
  name: "arch1",
  bootstrapList: process.env.BOOTSTRAP_LIST!.split(", "),
  isBootstrap: true,
  listenAddressesConfig: {
    ipAddress: process.env.IP_ADDRESS!,
    tcpPort: process.env.TCP_PORT!,
    wsPort: process.env.WS_PORT!,
    signalServerList: process.env.SIGNAL_SERVER_LIST!.split(", ")
  },
})

const arch2 = new Archaeologist({
  name: "arch2",
  bootstrapList: process.env.BOOTSTRAP_LIST!.split(", "),
  listenAddressesConfig: {
    ipAddress: process.env.IP_ADDRESS!,
    tcpPort: "9001",
    wsPort: "10001",
    signalServerList: process.env.SIGNAL_SERVER_LIST!.split(", ")
  },
})

await arch.initNode()
// await arch2.initNode('./peer-id2.json')
arch2.node.pubsub.subscribe("test_topic");
arch2.node.pubsub.addEventListener("message", (data) => console.log(`${arch2.name} got ${data}`));

console.log("1  -- ", arch.node.pubsub.getTopics());
console.log("2  -- ", arch2.node.pubsub.getTopics());

arch.publish("test_topic", "Bird bird bird, bird is the word!").catch(err => {
  console.error(err)
})



