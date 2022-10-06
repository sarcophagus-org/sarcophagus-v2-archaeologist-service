import 'dotenv/config'
import { getWeb3Interface } from './scripts/web3-interface'
import { Archaeologist } from "./models/archaeologist"
import { validateEnvVars } from './utils/validateEnv'
import { parseArgs } from './utils/cli_parsers/parseArgs'
import { retrieveOnchainData } from './utils/onchain-data'


export async function startService(opts: {
  nodeName: string,
  listenAddresses?: string[],
  peerId?: any,
  bootstrapList?: string[],
  isTest?: boolean,
}) {
  const web3Interface = await getWeb3Interface(opts.isTest);
  const config = opts.isTest ? { encryptionPublicKey: web3Interface.encryptionWallet.publicKey } : validateEnvVars()

  const { nodeName, bootstrapList, listenAddresses, peerId } = opts;

  const arch = new Archaeologist({
    name: nodeName,
    bootstrapList: bootstrapList ?? process.env.BOOTSTRAP_LIST?.split(",").map(s => s.trim()),
    listenAddresses,
    peerId,
    listenAddressesConfig: listenAddresses === undefined ? {
      ipAddress: process.env.IP_ADDRESS!,
      tcpPort: process.env.TCP_PORT!,
      wsPort: process.env.WS_PORT!,
      signalServerList: process.env.SIGNAL_SERVER_LIST!.split(",").map(s => s.trim())
    } : undefined,
  })

  await arch.initNode({ config, web3Interface })
  arch.setupCommunicationStreams();

  parseArgs(web3Interface);

  retrieveOnchainData(web3Interface);

  setInterval(() => retrieveOnchainData(web3Interface), 300000); // refetch every 5mins

  [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
    process.on(eventType, async () => {
      console.log(`${nodeName} received exit event: ${eventType}`)
      await arch.shutdown();
      process.exit(2);
    });
  })
}