import 'dotenv/config'
import { Archaeologist } from "./models/archaeologist"
import { validateEnvVars } from './utils/validateEnv'

const config = validateEnvVars()

const arch = new Archaeologist({
  name: "arch",
  bootstrapList: process.env.BOOTSTRAP_LIST!.split(",").map(s => s.trim()),
  listenAddressesConfig: {
    ipAddress: process.env.IP_ADDRESS!,
    tcpPort: process.env.TCP_PORT!,
    wsPort: process.env.WS_PORT!,
    signalServerList: process.env.SIGNAL_SERVER_LIST!.split(",").map(s => s.trim())
  }
})

await arch.initNode({ config })



