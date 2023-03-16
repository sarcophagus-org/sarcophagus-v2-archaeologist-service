import { getWeb3Interface } from "../../scripts/web3-interface";
import { schedulePublishPrivateKey } from "../scheduler";
import { getGracePeriod, getSarcophagiIds, inMemoryStore, SarcophagusData } from "../onchain-data";
import { BigNumber, ethers } from "ethers";
import { handleRpcError } from "../../utils/rpc-error-handler";
import { getBlockTimestampMs } from "./helpers";

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
          const currentBlockTimestampSec =  await getBlockTimestampMs() / 1000;

          const tooLateToUnwrap =
            currentBlockTimestampSec > endOfGracePeriod(sarcophagus, inMemoryStore.gracePeriod!);
          if (tooLateToUnwrap) {
            return;
          }

          // Account for out of sync system clocks
          // Scheduler will use the system clock which may not be in sync with
          // block.timestamp
          const systemClockDifference = (Date.now() / 1000) - currentBlockTimestampSec;

          // NOTE: If we are past the resurrection time (but still in the grace period)
          // Then schedule the unwrap for 5 seconds from now. Otherwise schedule for resurrection time
          // (plus 15 seconds to allow block.timestamp to advance past resurrection time).
          const resurrectionTimeMs =
            currentBlockTimestampSec > sarcophagus.resurrectionTime.toNumber()
              ? new Date(Date.now() + 5000)
              : new Date((sarcophagus.resurrectionTime.toNumber() + systemClockDifference) * 1000 + 15_000);

          schedulePublishPrivateKey(sarcoId, resurrectionTimeMs);

          sarcophagi.push({
            id: sarcoId,
            resurrectionTime: resurrectionTimeMs,
          });
        }
      } catch (e) {
        handleRpcError(e);
      }
    });

  return sarcophagi;
}
