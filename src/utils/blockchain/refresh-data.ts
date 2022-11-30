import { Web3Interface } from "../../scripts/web3-interface";
import { schedulePublishKeyShare } from "../scheduler";
import { getGracePeriod, getSarcophagiIds, inMemoryStore, SarcophagusData } from "../onchain-data";
import { BigNumber, ethers } from "ethers";

// TODO -- once typechain defs are in the sarcophagus-org package,
// the types in this file and onchain-data can get updated
const curseIsActive = (sarcophagus: any, archaeologist: any): boolean => {
  return (
    archaeologist.rawKeyShare === "0x" &&
    !sarcophagus.isCompromised &&
    !sarcophagus.resurrectionTime.eq(ethers.constants.MaxUint256)
  );
};

const endOfGracePeriod = (sarcophagus: any, gracePeriod: BigNumber): number => {
  return sarcophagus.resurrectionTime.toNumber() + gracePeriod.toNumber();
};

export async function fetchSarcophagiAndSchedulePublish(
  web3Interface: Web3Interface
): Promise<SarcophagusData[]> {
  inMemoryStore.gracePeriod = inMemoryStore.gracePeriod || (await getGracePeriod(web3Interface));

  const sarcophagi: SarcophagusData[] = [];
  const sarcoIds = await getSarcophagiIds(web3Interface);

  sarcoIds.map(async sarcoId => {
    const sarcophagus = await web3Interface.viewStateFacet.getSarcophagus(sarcoId);
    const archaeologist = await web3Interface.viewStateFacet.getSarcophagusArchaeologist(
      sarcoId,
      web3Interface.ethWallet.address
    );

    if (curseIsActive(sarcophagus, archaeologist)) {
      const nowSeconds = new Date().getTime() / 1000;

      const tooLateToUnwrap =
        nowSeconds > endOfGracePeriod(sarcophagus, inMemoryStore.gracePeriod!);
      if (tooLateToUnwrap) {
        return;
      }

      // NOTE: If we are past the resurrection time (but still in the grace period)
      // Then schedule the unwrap for 5 seconds from now. Else schedule for resurrection time.
      const resurrectionTimeMs =
        nowSeconds > sarcophagus.resurrectionTime.toNumber()
          ? new Date(Date.now() + 5000)
          : new Date(sarcophagus.resurrectionTime.toNumber() * 1000);

      schedulePublishKeyShare(web3Interface, sarcoId, resurrectionTimeMs);

      sarcophagi.push({
        id: sarcoId,
        resurrectionTime: resurrectionTimeMs,
      });
    }
  });

  return sarcophagi;
}
