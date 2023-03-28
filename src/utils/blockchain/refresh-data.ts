import { getWeb3Interface } from "../../scripts/web3-interface";
import { schedulePublishPrivateKey } from "../scheduler";
import { getGracePeriod, getSarcophagiIds, inMemoryStore, SarcophagusData } from "../onchain-data";
import { BigNumber, ethers } from "ethers";
import { handleRpcError } from "../rpc-error-handler";
import { getBlockTimestamp } from "./helpers";
import { archLogger } from "../../logger/chalk-theme";

const archStillNeedsToPublishPrivateKey = (archaeologist: any): boolean => {
  return archaeologist.privateKey === ethers.constants.HashZero;
}

const isSarcoInactive = (sarcophagus: any): boolean => {
  return (
    sarcophagus.resurrectionTime.eq(ethers.constants.MaxUint256) ||
    sarcophagus.isCompromised ||
    sarcophagus.isCleaned
  );
};

const endOfGracePeriod = (sarcophagus: any, gracePeriod: BigNumber): number => {
  return sarcophagus.resurrectionTime.toNumber() + gracePeriod.toNumber();
};

export async function fetchSarcophagiAndSchedulePublish(): Promise<SarcophagusData[]> {
  const web3Interface = await getWeb3Interface();
  inMemoryStore.gracePeriod = inMemoryStore.gracePeriod || (await getGracePeriod());

  const sarcophagi: SarcophagusData[] = [];
  const sarcoIds = await getSarcophagiIds();

  const currentBlockTimestampSec =  await getBlockTimestamp();

  const activeSarcoIds = sarcoIds.filter(id => !inMemoryStore.deadSarcophagusIds.includes(id));

  archLogger.debug('starting resync');
  for (const sarcoId of activeSarcoIds) {
    try {
      const sarcophagus = await web3Interface.viewStateFacet.getSarcophagus(sarcoId);

      // If sarcophagus is buried, cleaned or compromised, don't scheduled an unwrap
      if (isSarcoInactive(sarcophagus)) {
        inMemoryStore.deadSarcophagusIds.push(sarcoId);
        continue;
      }

      // If the current time is past the grace period, don't schedule an unwrap
      const tooLateToUnwrap = (currentBlockTimestampSec > endOfGracePeriod(sarcophagus, inMemoryStore.gracePeriod!));

      if (tooLateToUnwrap) {
        archLogger.debug(`Too late to unwrap: ${sarcoId} with resurrection time: ${sarcophagus.resurrectionTime.toNumber()} -- current time is ${Date.now() / 1000}`);
        inMemoryStore.deadSarcophagusIds.push(sarcoId);
        continue;
      }

      const archaeologist = await web3Interface.viewStateFacet.getSarcophagusArchaeologist(
        sarcoId,
        web3Interface.ethWallet.address
      );

      if (archStillNeedsToPublishPrivateKey(archaeologist)) {
        // Account for out of sync system clocks
        // Scheduler will use the system clock which may not be in sync with block.timestamp
        const systemClockDifferenceSecs = Math.round((Date.now() / 1000) - currentBlockTimestampSec);
        archLogger.debug(`currentBlockTimestampSec is ${currentBlockTimestampSec}`);
        archLogger.debug(`systemClockDifference is ${systemClockDifferenceSecs}`);

        // NOTE: If we are past the resurrection time (but still in the grace period)
        // Then schedule the unwrap for 5 seconds from now. Otherwise schedule for resurrection time
        // (plus 15 seconds to allow block.timestamp to advance past resurrection time).
        archLogger.debug(`resurrectionTime raw: ${sarcophagus.resurrectionTime.toNumber()}`);

        const isResurrectionTimeInPast = currentBlockTimestampSec > sarcophagus.resurrectionTime.toNumber();
        let scheduledResurrectionTime;

        if (isResurrectionTimeInPast) {
          archLogger.debug(`resurrection time is in the past, scheduling for 5 seconds from now`);
          scheduledResurrectionTime = new Date(Date.now() + 5000);
        } else {
          // schedule resurrection time, taking into account system clock differential + buffer
          scheduledResurrectionTime = new Date(((sarcophagus.resurrectionTime.toNumber() + systemClockDifferenceSecs) * 1000) + 15_000);
        }

        archLogger.debug(`resurrection time with buffer: ${scheduledResurrectionTime}`);

        schedulePublishPrivateKey(sarcoId, scheduledResurrectionTime, sarcophagus.resurrectionTime.toNumber());

        sarcophagi.push({
          id: sarcoId,
          resurrectionTime: scheduledResurrectionTime,
        });
      } else {
        // Save inactive ones in memory to save RPC calls on next re-sync
        inMemoryStore.deadSarcophagusIds.push(sarcoId);
      }
    } catch (e) {
      handleRpcError(e);
    }
  }

  return sarcophagi;
}
