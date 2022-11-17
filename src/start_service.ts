import "dotenv/config";
import { Web3Interface } from "./scripts/web3-interface";
import { Archaeologist } from "./models/archaeologist";
import { validateEnvVars } from "./utils/validateEnv";
import { retrieveAndStoreOnchainProfileAndSarcophagi } from "./utils/onchain-data";

export async function startService(opts: {
  nodeName: string;
  web3Interface: Web3Interface;
  listenAddresses?: string[];
  peerId?: any;
  bootstrapList?: string[];
}) {
  const config = validateEnvVars();

  const { nodeName, bootstrapList, listenAddresses, peerId } = opts;

  const arch = new Archaeologist({
    name: nodeName,
    bootstrapList: bootstrapList ?? process.env.BOOTSTRAP_LIST?.split(",").map(s => s.trim()),
    listenAddresses,
    peerId,
    listenAddressesConfig:
      listenAddresses === undefined
        ? {
            signalServerList: process.env.SIGNAL_SERVER_LIST!.split(",").map(s => s.trim()),
          }
        : undefined,
  });

  await arch.initNode({ config: config, web3Interface: opts.web3Interface });
  arch.setupCommunicationStreams();

  retrieveAndStoreOnchainProfileAndSarcophagi(opts.web3Interface);

  setInterval(() => retrieveAndStoreOnchainProfileAndSarcophagi(opts.web3Interface), 300000); // refetch every 5mins

  [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach(eventType => {
    process.on(eventType, async () => {
      console.log(`${nodeName} received exit event: ${eventType}`);
      await arch.shutdown();
      process.exit(2);
    });
  });
}
