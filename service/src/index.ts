import 'dotenv/config'
import { getWeb3Interface } from './scripts/web3-interface'
import { Archaeologist } from "./models/archaeologist"
import { validateEnvVars } from './utils/validateEnv'
import { parseArgs } from './utils/parseArgs'
import { setupEventListeners } from './utils/contract-event-listeners'
import { retrieveOnchainData } from './utils/onchain-data'

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
arch.setupIncomingConfigStream();

const web3Interface = await getWeb3Interface();

parseArgs(web3Interface);

retrieveOnchainData(web3Interface);

setupEventListeners(web3Interface);