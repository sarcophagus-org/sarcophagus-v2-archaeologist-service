import 'dotenv/config'
import { Archaeologist } from "./models/archaeologist"
import { validateEnvVars } from "./utils";

validateEnvVars()

const arch = new Archaeologist({
  name: "arch1",
  bootstrapList: process.env.BOOTSTRAP_LIST!.split(", "),
  listenAddressesConfig: {
    ipAddress: process.env.IP_ADDRESS!,
    tcpPort: process.env.TCP_PORT!,
    wsPort: process.env.WS_PORT!,
    signalServerList: process.env.SIGNAL_SERVER_LIST!.split(", ")
  }
})

await arch.initNode()



