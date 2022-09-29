import scheduler from 'node-schedule';
import { Web3Interface } from 'scripts/web3-interface';
import { unwrapSarcophagus } from './onchain-data';


const scheduledUnwraps: Record<string, scheduler.Job | undefined> = {};

export function scheduleUnwrap(web3Interface: Web3Interface, sarcoId: string, date: Date) {
    scheduledUnwraps[sarcoId]?.cancel();

    const job = scheduler.scheduleJob(date, () => {
        unwrapSarcophagus(web3Interface, sarcoId);
    });

    scheduledUnwraps[sarcoId] = job;
}