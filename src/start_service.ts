import "dotenv/config";
import { getWeb3Interface } from "./scripts/web3-interface";
import { Archaeologist } from "./models/archaeologist";
import { validateEnvVars } from "./utils/validateEnv";
import { fetchProfileAndSchedulePublish } from "./utils/onchain-data";
import { healthCheck } from "./utils/health-check";
import { loadPeerIdFromFile } from "./utils";
import { SIGNAL_SERVER_LIST } from "./models/node-config";

export async function startService(opts: {
  nodeName: string;
  listenAddresses?: string[];
  peerId?: any;
  bootstrapList?: string[];
  isTest?: boolean;
}) {
  const web3Interface = await getWeb3Interface(opts.isTest);
  const config = opts.isTest
    ? { encryptionPublicKey: web3Interface.encryptionWallet.publicKey }
    : validateEnvVars();

  let { nodeName, bootstrapList, listenAddresses, peerId } = opts;

  peerId = peerId ?? (await loadPeerIdFromFile());

  const arch = new Archaeologist({
    name: nodeName,
    bootstrapList: bootstrapList ?? process.env.BOOTSTRAP_LIST?.split(",").map(s => s.trim()),
    listenAddresses,
    peerId: peerId,
    listenAddressesConfig:
      listenAddresses === undefined
        ? {
            signalServerList: SIGNAL_SERVER_LIST,
          }
        : undefined,
  });

  await healthCheck(web3Interface, peerId.toString());
  fetchProfileAndSchedulePublish(web3Interface);
  setInterval(() => fetchProfileAndSchedulePublish(web3Interface), 300000); // refetch every 5mins

  await arch.initNode({ config, web3Interface });
  arch.setupCommunicationStreams();

  // TODO: remove once node connection issues are resolved
  // Restart node on 20 min interval in attempt to avoid websocket / wrtc issues
  setInterval(() => arch.restartNode(), 20 * 60 * 1000);

  [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach(eventType => {
    process.on(eventType, async () => {
      console.log(`${nodeName} received exit event: ${eventType}`);
      await arch.shutdown();
      process.exit(2);
    });
  });
}
