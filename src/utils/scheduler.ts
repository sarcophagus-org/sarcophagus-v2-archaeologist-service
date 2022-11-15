import scheduler from "node-schedule";
import { Web3Interface } from "scripts/web3-interface";
import { archLogger } from "../logger/chalk-theme";
import { unwrapSarcophagus } from "./blockchain/unwrap";

const scheduledUnwraps: Record<string, scheduler.Job | undefined> = {};

// Schedule an unwrap job for each sarco this arch is cursed on. `scheduleUnwrap` will cancel existing
// schedules, so no duplicate jobs will be created.
export function scheduleUnwrap(web3Interface: Web3Interface, sarcoId: string, date: Date) {
  scheduledUnwraps[sarcoId]?.cancel();
  archLogger.info(`Scheduling unwrap at: ${`${date.toDateString()} ${date.toTimeString()}`}`);
  scheduledUnwraps[sarcoId] = scheduler.scheduleJob(date, async () => {
    await unwrapSarcophagus(web3Interface, sarcoId);
  });
}
