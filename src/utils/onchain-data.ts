import { BigNumber, ethers } from "ethers";
import { getWeb3Interface, Web3Interface } from "scripts/web3-interface";
import { fetchSarcophagiAndSchedulePublish } from "./blockchain/refresh-data";

export interface OnchainProfile {
  exists: boolean;
  minimumDiggingFeePerSecond: BigNumber;
  maximumRewrapInterval: BigNumber;
  maximumResurrectionTime: BigNumber;
  freeBond: BigNumber;
  cursedBond: BigNumber;
  peerId: string;
}

export interface SarcophagusData {
  id: string;
  resurrectionTime: Date;
}

interface InMemoryStore {
  sarcophagi: SarcophagusData[];
  sarcoIdsInProcessOfHavingPrivateKeyPublished: string[];
  profile?: OnchainProfile;
  gracePeriod?: BigNumber;
}

export const inMemoryStore: InMemoryStore = {
  sarcophagi: [],
  sarcoIdsInProcessOfHavingPrivateKeyPublished: [],
};


export async function fetchProfileAndSchedulePublish() {
  inMemoryStore.profile = await getOnchainProfile();
  inMemoryStore.sarcophagi = await fetchSarcophagiAndSchedulePublish();
}

export async function getOnchainProfile(): Promise<OnchainProfile> {
  const web3Interface = await getWeb3Interface();
  try {
    return {
      exists: true,
      ...(await web3Interface.viewStateFacet.getArchaeologistProfile(
        web3Interface.ethWallet.address
      )),
    };
  } catch (e) {
    if (e.errorName === "ArchaeologistProfileExistsShouldBe" && e.errorArgs.includes(true)) {
      return { exists: false } as OnchainProfile;
    } else throw e;
  }
}

export async function getRewards(): Promise<BigNumber> {
  const web3Interface = await getWeb3Interface();
  return web3Interface.viewStateFacet.getRewards(web3Interface.ethWallet.address);
}

export async function getSarcoBalance(): Promise<BigNumber> {
  const web3Interface = await getWeb3Interface();
  return web3Interface.sarcoToken.balanceOf(web3Interface.ethWallet.address);
}

export async function getGracePeriod(): Promise<BigNumber> {
  const web3Interface = await getWeb3Interface();
  return web3Interface.viewStateFacet.getGracePeriod();
}

export async function getEthBalance(): Promise<BigNumber> {
  const web3Interface = await getWeb3Interface();
  return web3Interface.ethWallet.getBalance();
}

export async function getFreeBondBalance(): Promise<BigNumber> {
  const web3Interface = await getWeb3Interface();
  return web3Interface.viewStateFacet.getFreeBond(web3Interface.ethWallet.address);
}

export async function getSarcophagiIds(): Promise<string[]> {
  const web3Interface = await getWeb3Interface();
  return web3Interface.viewStateFacet.getArchaeologistSarcophagi(web3Interface.ethWallet.address);
}

export enum SarcophagusState {
  DoesNotExist,
  Active,
  Resurrecting,
  Resurrected,
  Buried,
  Cleaned,
  Accused,
  Failed,
}
