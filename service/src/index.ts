import 'dotenv/config'
import { getWeb3Interface } from './scripts/web3-interface'
import { Archaeologist } from "./models/archaeologist"
import { validateEnvVars } from './utils/validateEnv'
import { parseArgs } from './utils/cli_parsers/parseArgs'
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

const web3Interface = await getWeb3Interface();

await arch.initNode({ config, web3Interface })
arch.setupCommunicationStreams();

parseArgs(web3Interface);

retrieveOnchainData(web3Interface);

setInterval(() => retrieveOnchainData(web3Interface), 300000); // refetch every 5mins
setupEventListeners(web3Interface);

[`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
  process.on(eventType, async () => {
    console.log(`received exit event: ${eventType}`)
    await arch.shutdown();
    process.exit(2);
  });
})