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
  validateEnvVars();

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

  await healthCheck(peerId.toString());
  fetchProfileAndSchedulePublish();

  // refetch every so often (default is 10 mins)
  const refreshInterval = process.env.REFETCH_INTERVAL
    ? Number(process.env.REFETCH_INTERVAL)
    : 600_000;
  setInterval(() => fetchProfileAndSchedulePublish(), refreshInterval);

  // TODO -- delay starting the node until the creation window has passed
  // Consider only doing this if arch as at least one sarcophagus
  await arch.initLibp2pNode();
  arch.setupSarcophagusNegotiationStream();

  // Restart node on 20 min interval in attempt to avoid websocket / wrtc issues
  setInterval(() => arch.restartNode(), 20 * 60 * 1000);

  [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach(eventType => {
    process.on(eventType, async e => {
      console.log(`${nodeName} received exit event: ${eventType}`);
      console.log(e);
      await arch.shutdown();
      process.exit(2);
    });
  });
}
