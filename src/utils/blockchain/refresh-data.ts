import { Web3Interface } from "../../scripts/web3-interface";
import { unwrapSarcophagus } from "./unwrap";
import { scheduleUnwrap } from "../scheduler";
import { getGracePeriod, getSarcophagiIds, inMemoryStore, SarcophagusData, SarcophagusState } from "../onchain-data";
import { BigNumber } from "ethers";

const curseIsActive = (sarcophagus: any, archaeologist: any): boolean => {
  return sarcophagus.state === SarcophagusState.Active && archaeologist.unencryptedShard === '0x';
}

const endOfGracePeriod = (sarcophagus: any, gracePeriod: BigNumber): number => {
  return sarcophagus.resurrectionTime.toNumber() + gracePeriod.toNumber();
}

export async function fetchSarcophagiAndScheduleUnwraps(
  web3Interface: Web3Interface
): Promise<SarcophagusData[]> {
  inMemoryStore.gracePeriod = inMemoryStore.gracePeriod || await getGracePeriod(web3Interface);

  const sarcophagi: SarcophagusData[] = [];
  const sarcoIds = await getSarcophagiIds(web3Interface);

  sarcoIds.map(async sarcoId => {
    const sarcophagus = await web3Interface.viewStateFacet.getSarcophagus(sarcoId);
    const archaeologist = await web3Interface.viewStateFacet.getSarcophagusArchaeologist(
      sarcoId,
      web3Interface.ethWallet.address
    );

    if (curseIsActive(sarcophagus, archaeologist)) {
      const now = new Date().getTime() / 1000;

      const tooLateToUnwrap = now > endOfGracePeriod(sarcophagus, inMemoryStore.gracePeriod!);
      if (tooLateToUnwrap) { return; }

      const resurrectionTime = new Date(sarcophagus.resurrectionTime.toNumber() * 1000);
      sarcophagi.push({
        id: sarcoId,
        resurrectionTime,
      });

      if (now > sarcophagus.resurrectionTime.toNumber()) {
        await unwrapSarcophagus(web3Interface, sarcoId);
      } else {
        scheduleUnwrap(web3Interface, sarcoId, resurrectionTime);
      }
    }
  });

  return sarcophagi;
}