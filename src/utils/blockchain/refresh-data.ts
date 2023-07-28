import { getWeb3Interface } from "../../scripts/web3-interface";
import { schedulePublishPrivateKeyWithBuffer } from "../scheduler";
import { getGracePeriod, inMemoryStore, SarcophagusData } from "../onchain-data";
import { BigNumber, ethers } from "ethers";
import { handleRpcError } from "../rpc-error-handler";
import { getBlockTimestamp } from "./helpers";
import { archLogger } from "../../logger/chalk-theme";
import { SubgraphData } from "../graphql";

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

        // If sarcophagus is buried, cleaned or compromised, don't schedule an unwrap
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
            `Too late to unwrap: ${sarcoId} with resurrection time: ${sarcoFromContract.resurrectionTime.toNumber()} -- current time is ${
              Date.now() / 1000
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
          const scheduledResurrectionTime = schedulePublishPrivateKeyWithBuffer(
            currentBlockTimestampSec,
            sarcoId,
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
        await handleRpcError(e);
      }
    });

  return sarcophagi;
}
