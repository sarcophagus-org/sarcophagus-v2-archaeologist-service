import scheduler from "node-schedule";
import { Web3Interface } from "scripts/web3-interface";
import { archLogger } from "../logger/chalk-theme";
import { unwrapSarcophagus } from "./blockchain/unwrap";
import { inMemoryStore } from "./onchain-data";

const scheduledUnwraps: Record<string, scheduler.Job | undefined> = {};

export function scheduleUnwrap(web3Interface: Web3Interface, sarcoId: string, date: Date) {
  // If sarcophagus is being unwrapped, dont schedule job
  const sarcoIndex = inMemoryStore.sarcoIdsInProcessOfBeingUnwrapped.findIndex(id => id === sarcoId);
  if (sarcoIndex !== -1) { return }

  if (!scheduledUnwraps[sarcoId]) {
    archLogger.info(`Scheduling unwrap at: ${date.toString()}`);
  }

  // Cancel existing schedules, so no duplicate jobs will be created.
  scheduledUnwraps[sarcoId]?.cancel();
  scheduledUnwraps[sarcoId] = scheduler.scheduleJob(date, async () => {
    await unwrapSarcophagus(web3Interface, sarcoId);
  });
}
