import scheduler from "node-schedule";
import { archLogger } from "../logger/chalk-theme";
import { publishPrivateKey } from "./blockchain/publish-private-key";
import { inMemoryStore } from "./onchain-data";

const scheduledPublishPrivateKey: Record<string, scheduler.Job | undefined> = {};

export function schedulePublishPrivateKey(sarcoId: string, date: Date) {
  // If sarcophagus is being unwrapped, dont schedule job
  const sarcoIndex = inMemoryStore.sarcoIdsInProcessOfHavingPrivateKeyPublished.findIndex(
    id => id === sarcoId
  );

  if (sarcoIndex !== -1) {
    return;
  }

  if (!scheduledPublishPrivateKey[sarcoId]) {
    archLogger.notice(`Scheduling unwrap for ${sarcoId} at: ${date.getTime() / 1000} (${date.toString()})`);
  }

  // Cancel existing schedules, so no duplicate jobs will be created.
  scheduledPublishPrivateKey[sarcoId]?.cancel();
  scheduledPublishPrivateKey[sarcoId] = scheduler.scheduleJob(date, async () => {
    await publishPrivateKey(sarcoId);
  });
}
