import { getWeb3Interface } from "../../scripts/web3-interface";
import { schedulePublishPrivateKey } from "../scheduler";
import { getGracePeriod, getSarcophagiIds, inMemoryStore, SarcophagusData } from "../onchain-data";
import { BigNumber, ethers } from "ethers";
import { handleRpcError } from "../rpc-error-handler";
import { getBlockTimestamp } from "./helpers";
import { archLogger } from "../../logger/chalk-theme";

// TODO -- once typechain defs are in the sarcophagus-org package,
// the types in this file and onchain-data can get updated
const curseIsActive = (sarcoId: string, sarcophagus: any, archaeologist: any): boolean => {
  inMemoryStore.deadSarcophagusIds.push(sarcoId);

  return (
    archaeologist.privateKey === ethers.constants.HashZero &&
    !sarcophagus.isCompromised &&
    !sarcophagus.isCleaned &&
    !sarcophagus.resurrectionTime.eq(ethers.constants.MaxUint256)
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

  sarcoIds
    .filter(id => !inMemoryStore.deadSarcophagusIds.includes(id))
    .map(async sarcoId => {
      try {
        const sarcophagus = await web3Interface.viewStateFacet.getSarcophagus(sarcoId);

        const archaeologist = await web3Interface.viewStateFacet.getSarcophagusArchaeologist(
          sarcoId,
          web3Interface.ethWallet.address
        );

        if (curseIsActive(sarcoId, sarcophagus, archaeologist)) {
          const currentBlockTimestampSec =  await getBlockTimestamp();

          archLogger.notice(`currentBlockTimestampSec is ${currentBlockTimestampSec}`);

          const tooLateToUnwrap =
            currentBlockTimestampSec > endOfGracePeriod(sarcophagus, inMemoryStore.gracePeriod!);
          if (tooLateToUnwrap) {
            archLogger.warn(`Too late to unwrap: ${sarcoId} with resurrection time: ${sarcophagus.resurrectionTime.toNumber()} -- current time is ${Date.now() / 1000}`);
            return;
          }

          // Account for out of sync system clocks
          // Scheduler will use the system clock which may not be in sync with block.timestamp
          const systemClockDifferenceSecs = Math.round((Date.now() / 1000) - currentBlockTimestampSec);
          archLogger.notice(`systemClockDifference is ${systemClockDifferenceSecs}`);

          // NOTE: If we are past the resurrection time (but still in the grace period)
          // Then schedule the unwrap for 5 seconds from now. Otherwise schedule for resurrection time
          // (plus 15 seconds to allow block.timestamp to advance past resurrection time).
          archLogger.notice(`resurrectionTime bignumber: ${sarcophagus.resurrectionTime.toString()}`);
          archLogger.notice(`resurrectionTime number: ${sarcophagus.resurrectionTime.toNumber()}`);

          const isResurrectionTimeInPast = currentBlockTimestampSec > sarcophagus.resurrectionTime.toNumber();
          let scheduledResurrectionTime;

          if (isResurrectionTimeInPast) {
            archLogger.notice(`resurrection time is in the past, scheduling for 5 seconds from now`);
            scheduledResurrectionTime = new Date(Date.now() + 5000);
          } else {
            // schedule resurrection time, taking into account system clock differential + buffer
            scheduledResurrectionTime = new Date(((sarcophagus.resurrectionTime.toNumber() + systemClockDifferenceSecs) * 1000) + 15_000);
          }

          archLogger.notice(`resurrection time with buffer: ${scheduledResurrectionTime}`);

          schedulePublishPrivateKey(sarcoId, scheduledResurrectionTime);

          sarcophagi.push({
            id: sarcoId,
            resurrectionTime: scheduledResurrectionTime,
          });
        }
      } catch (e) {
        handleRpcError(e);
      }
    });

  return sarcophagi;
}
