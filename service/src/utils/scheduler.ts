import scheduler from 'node-schedule';
import { Web3Interface } from 'scripts/web3-interface';
import { unwrapSarcophagus } from './onchain-data';

export function scheduleUnwrap(web3Interface: Web3Interface, sarcoId: string, date: Date) {
    scheduler.scheduleJob(date, () => {
        unwrapSarcophagus(web3Interface, sarcoId);
    });
}