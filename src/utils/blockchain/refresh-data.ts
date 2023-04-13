import { getWeb3Interface } from "../../scripts/web3-interface";
import { schedulePublishPrivateKey } from "../scheduler";
import { getGracePeriod, inMemoryStore, SarcophagusData } from "../onchain-data";
import { BigNumber, ethers } from "ethers";
import { handleRpcError } from "../rpc-error-handler";
import { getBlockTimestamp, getDateFromTimestamp } from "./helpers";
import { archLogger } from "../../logger/chalk-theme";
import { SubgraphData } from "../../utils/graphql";

const archStillNeedsToPublishPrivateKey = (archaeologist: any): boolean => {
  return archaeologist.privateKey === ethers.constants.HashZero;
};

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
  const currentBlockTimestampSec = await getBlockTimestamp();

  (await SubgraphData.getSarcophagi())
    .filter(s => !inMemoryStore.deadSarcophagusIds.includes(s.id))
    .map(async sarco => {
      const { id: sarcoId, creationDate } = sarco;

      try {
        const sarcoFromContract = await web3Interface.viewStateFacet.getSarcophagus(sarcoId);

        // If sarcophagus is buried, cleaned or compromised, don't scheduled an unwrap
        if (isSarcoInactive(sarcoFromContract)) {
          inMemoryStore.deadSarcophagusIds.push(sarcoId);
          return;
        }

        // If the current time is past the grace period, don't schedule an unwrap
        const tooLateToUnwrap =
          currentBlockTimestampSec >
          endOfGracePeriod(sarcoFromContract, inMemoryStore.gracePeriod!);

        if (tooLateToUnwrap) {
          archLogger.debug(
            `Too late to unwrap: ${sarcoId} with resurrection time: ${sarcoFromContract.resurrectionTime.toNumber()} -- current time is ${Date.now() / 1000
            }`
          );

          // Dont attempt to unwrap this sarcophagus on next sync
          inMemoryStore.deadSarcophagusIds.push(sarcoId);
          return;
        }

        const archaeologist = await web3Interface.viewStateFacet.getSarcophagusArchaeologist(
          sarcoId,
          web3Interface.ethWallet.address
        );

        if (archStillNeedsToPublishPrivateKey(archaeologist)) {
          // Account for out of sync system clocks
          // Scheduler will use the system clock which may not be in sync with block.timestamp
          const systemClockDifferenceSecs = Math.round(
            Date.now() / 1000 - currentBlockTimestampSec
          );
          archLogger.debug(`currentBlockTimestampSec is ${currentBlockTimestampSec}`);
          archLogger.debug(`systemClockDifference is ${systemClockDifferenceSecs}`);

          // NOTE: If we are past the resurrection time (but still in the grace period)
          // Then schedule the unwrap for 5 seconds from now. Otherwise schedule for resurrection time
          // (plus 15 seconds to allow block.timestamp to advance past resurrection time).
          archLogger.debug(
            `resurrectionTime raw: ${sarcoFromContract.resurrectionTime.toNumber()}`
          );

          const isResurrectionTimeInPast =
            currentBlockTimestampSec > sarcoFromContract.resurrectionTime.toNumber();
          let scheduledResurrectionTime;

          if (isResurrectionTimeInPast) {
            archLogger.debug(`resurrection time is in the past, scheduling for 5 seconds from now`);
            scheduledResurrectionTime = new Date(Date.now() + 5000);
          } else {
            // schedule resurrection time, taking into account system clock differential + buffer
            scheduledResurrectionTime = new Date(
              (sarcoFromContract.resurrectionTime.toNumber() + systemClockDifferenceSecs) * 1000 +
              15_000
            );
          }

          archLogger.debug(`resurrection time with buffer: ${scheduledResurrectionTime}`);

          schedulePublishPrivateKey(
            sarcoId,
            scheduledResurrectionTime,
            sarcoFromContract.resurrectionTime.toNumber()
          );

          sarcophagi.push({
            id: sarcoId,
            resurrectionTime: scheduledResurrectionTime,
            perSecondFee: archaeologist.diggingFeePerSecond,
            cursedAmount: archaeologist.curseFee,
            creationDate,
          });
        } else {
          // Save inactive ones in memory to save RPC calls on next re-sync
          inMemoryStore.deadSarcophagusIds.push(sarcoId);
        }
      } catch (e) {
        handleRpcError(e);
      }
    });

  return sarcophagi;
}
