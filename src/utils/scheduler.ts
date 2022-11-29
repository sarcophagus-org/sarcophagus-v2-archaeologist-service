import scheduler from "node-schedule";
import { Web3Interface } from "scripts/web3-interface";
import { archLogger } from "../logger/chalk-theme";
import { publishKeyShare } from "./blockchain/publish-key-share";
import { inMemoryStore } from "./onchain-data";

const scheduledPublishKeyShares: Record<string, scheduler.Job | undefined> = {};

export function schedulePublishKeyShare(web3Interface: Web3Interface, sarcoId: string, date: Date) {
  // If sarcophagus is being unwrapped, dont schedule job
  const sarcoIndex = inMemoryStore.sarcoIdsInProcessOfHavingKeySharesPublished.findIndex(id => id === sarcoId);
  if (sarcoIndex !== -1) { return }

  if (!scheduledPublishKeyShares[sarcoId]) {
    archLogger.info(`Scheduling publish key share at: ${date.toString()}`);
  }

  // Cancel existing schedules, so no duplicate jobs will be created.
  scheduledPublishKeyShares[sarcoId]?.cancel();
  scheduledPublishKeyShares[sarcoId] = scheduler.scheduleJob(date, async () => {
    await publishKeyShare(web3Interface, sarcoId);
  });
}
