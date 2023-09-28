import scheduler from "node-schedule";
import { archLogger } from "../logger/chalk-theme";
import { publishPrivateKey } from "./blockchain/publish-private-key";
import { inMemoryStore } from "./onchain-data";
import { NetworkContext } from "../network-config";

const scheduledPublishPrivateKey: Record<string, scheduler.Job | undefined> = {};
const sarcoIdToResurrectionTime: Record<string, number> = {};

function schedulePublishPrivateKey(
  sarcoId: string,
  resurrectionTime: Date,
  exactResurrectionTime: number,
  networkContext: NetworkContext
) {
  // If sarcophagus is being unwrapped, dont schedule job
  const sarcoIndex = inMemoryStore.sarcoIdsInProcessOfHavingPrivateKeyPublished.findIndex(
    id => id === sarcoId
  );

  if (sarcoIndex !== -1) {
    return;
  }

  if (!scheduledPublishPrivateKey[sarcoId]) {
    archLogger.notice(
      `[${networkContext.networkName}] Scheduling unwrap for ${sarcoId} at: ${
        resurrectionTime.getTime() / 1000
      } (${resurrectionTime.toString()})`
    );
  } else {
    // If time is different than one in memory, a rewrap has occurred
    if (sarcoIdToResurrectionTime[sarcoId] !== exactResurrectionTime) {
      archLogger.notice(
        `[${networkContext.networkName}] Scheduling rewrap for ${sarcoId} at: ${
          resurrectionTime.getTime() / 1000
        } (${resurrectionTime.toString()})`
      );
    }
  }

  // Stored just for purposes of logging
  sarcoIdToResurrectionTime[sarcoId] = exactResurrectionTime;

  // Cancel existing schedules, so no duplicate jobs will be created.
  scheduledPublishPrivateKey[sarcoId]?.cancel();
  scheduledPublishPrivateKey[sarcoId] = scheduler.scheduleJob(resurrectionTime, async () => {
    await publishPrivateKey(sarcoId, networkContext);
  });
}

export function cancelSheduledPublish(sarcoId: string) {
  scheduledPublishPrivateKey[sarcoId]?.cancel();
}

export function schedulePublishPrivateKeyWithBuffer(
  currentBlockTimestampSec: number,
  sarcoId: string,
  resurrectionTimeSec: number,
  networkContext: NetworkContext
): Date {
  // Account for out of sync system clocks
  // Scheduler will use the system clock which may not be in sync with block.timestamp
  const systemClockDifferenceSecs = Math.round(Date.now() / 1000 - currentBlockTimestampSec);
  archLogger.debug(
    `[${networkContext.networkName}] currentBlockTimestampSec is ${currentBlockTimestampSec}`
  );
  archLogger.debug(`systemClockDifference is ${systemClockDifferenceSecs}`);

  // NOTE: If we are past the resurrection time (but still in the grace period)
  // Then schedule the unwrap for 5 seconds from now. Otherwise schedule for resurrection time
  // (plus 15 seconds to allow block.timestamp to advance past resurrection time).
  archLogger.debug(`[${networkContext.networkName}] resurrectionTime raw: ${resurrectionTimeSec}`);

  const isResurrectionTimeInPast = currentBlockTimestampSec > resurrectionTimeSec;
  let scheduledResurrectionTime: Date;

  if (isResurrectionTimeInPast) {
    archLogger.debug(
      `[${networkContext.networkName}] resurrection time is in the past, scheduling for 5 seconds from now`
    );
    scheduledResurrectionTime = new Date(Date.now() + 5000);
  } else {
    // schedule resurrection time, taking into account system clock differential + buffer
    scheduledResurrectionTime = new Date(
      (resurrectionTimeSec + systemClockDifferenceSecs) * 1000 + 15_000
    );
  }

  archLogger.debug(
    `[${networkContext.networkName}] resurrection time with buffer: ${scheduledResurrectionTime}`
  );

  schedulePublishPrivateKey(
    sarcoId,
    scheduledResurrectionTime,
    resurrectionTimeSec,
    networkContext
  );

  return scheduledResurrectionTime;
}
