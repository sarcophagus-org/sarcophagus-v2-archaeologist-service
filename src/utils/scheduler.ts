import scheduler from "node-schedule";
import { Web3Interface } from "scripts/web3-interface";
import { archLogger } from "../logger/chalk-theme";
import { unwrapSarcophagus } from "./blockchain/unwrap";

const scheduledUnwraps: Record<string, scheduler.Job | undefined> = {};

//This will cancel existing schedules, so no duplicate jobs will be created.
export function scheduleUnwrap(web3Interface: Web3Interface, sarcoId: string, date: Date) {
  if (!scheduledUnwraps[sarcoId]) {
    archLogger.info(`Scheduling unwrap at: ${date.toString()}`);
  }
  scheduledUnwraps[sarcoId]?.cancel();
  scheduledUnwraps[sarcoId] = scheduler.scheduleJob(date, async () => {
    await unwrapSarcophagus(web3Interface, sarcoId);
  });
}
