import scheduler from "node-schedule";
import { Web3Interface } from "scripts/web3-interface";
import { archLogger } from "../logger/chalk-theme";
import { publishPrivateKey } from "./blockchain/publish-private-key";
import { inMemoryStore } from "./onchain-data";

const scheduledPublishPrivateKey: Record<string, scheduler.Job | undefined> = {};

export function schedulePublishPrivateKey(
  web3Interface: Web3Interface,
  sarcoId: string,
  date: Date
) {
  // If sarcophagus is being unwrapped, dont schedule job
  const sarcoIndex = inMemoryStore.sarcoIdsInProcessOfHavingPrivateKeyPublished.findIndex(
    id => id === sarcoId
  );

  if (sarcoIndex !== -1) {
    return;
  }

  if (!scheduledPublishPrivateKey[sarcoId]) {
    archLogger.info(`Scheduling publish private key at: ${date.toString()}`);
  }

  // Cancel existing schedules, so no duplicate jobs will be created.
  scheduledPublishPrivateKey[sarcoId]?.cancel();
  scheduledPublishPrivateKey[sarcoId] = scheduler.scheduleJob(date, async () => {
    await publishPrivateKey(web3Interface, sarcoId);
  });
}
