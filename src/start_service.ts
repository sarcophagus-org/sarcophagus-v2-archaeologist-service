import "dotenv/config";
import { Archaeologist } from "./models/archaeologist";
import { validateEnvVars } from "./utils/validateEnv";
import { fetchProfileAndSchedulePublish } from "./utils/onchain-data";
import { healthCheck, warnIfEthBalanceIsLow } from "./utils/health-check";
import { loadPeerIdFromFile } from "./utils";
import { SIGNAL_SERVER_LIST } from "./models/node-config";
import { archLogger } from "./logger/chalk-theme";
import { setupEventListeners } from "./utils/contract-event-listeners";
import { SarcoSupportedNetwork } from "@sarcophagus-org/sarcophagus-v2-sdk";
import { getWeb3Interface } from "./scripts/web3-interface";

const RESTART_INTERVAL = 1_200_000; // 2O Minutes
const CONTRACT_DATA_REFETCH_INTERVAL = process.env.REFETCH_INTERVAL
  ? Number(process.env.REFETCH_INTERVAL)
  : 600_000; // (default is 10 mins)

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

  
  const chainIds = process.env.CHAIN_IDS!.split(",").map(idStr => Number(idStr.trim())) as SarcoSupportedNetwork[];  
  
  chainIds.forEach(async chainId => {
    await healthCheck(chainId, peerId.toString());

    // refetch every so often
    // TODO: restore this. It's commented out for testing. (TODO TODO: Is this still a thing?)
    // setInterval(() => fetchProfileAndSchedulePublish(), CONTRACT_DATA_REFETCH_INTERVAL);
    const networkContext = (await getWeb3Interface()).getNetworkContext(chainId);
    fetchProfileAndSchedulePublish(networkContext);
    setupEventListeners(chainId);
    setInterval(async () => warnIfEthBalanceIsLow(networkContext), RESTART_INTERVAL);
  });

  // TODO -- delay starting the node until the creation window has passed?
  // Consider only doing this if arch as at least one sarcophagus
  await arch.initLibp2pNode();
  arch.setupSarcophagusNegotiationStreams();

  // Restart node on 20 min interval in attempt to avoid websocket issues
  setInterval(async () => arch.restartNode(), RESTART_INTERVAL);

  [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach(eventType => {
    process.on(eventType, async e => {
      archLogger.info(`${nodeName} received exit event: ${eventType}`, true);
      archLogger.info(e, true);
      await arch.shutdown();
      process.exit(2);
    });
  });
}
