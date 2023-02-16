import { BigNumber, ethers } from "ethers";
import { Web3Interface } from "scripts/web3-interface";
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

export async function fetchProfileAndSchedulePublish(web3Interface: Web3Interface) {
  inMemoryStore.profile = await getOnchainProfile(web3Interface);
  inMemoryStore.sarcophagi = await fetchSarcophagiAndSchedulePublish(web3Interface);
}

export async function getOnchainProfile(web3Interface: Web3Interface): Promise<OnchainProfile> {
  try {
    return {
      exists: true,
      ...(await web3Interface.viewStateFacet.getArchaeologistProfile(
        web3Interface.ethWallet.address
      )),
    };
  } catch (e) {
    if (e.errorName === "ArchaeologistProfileExistsShouldBe" && e.errorArgs.includes(true)) {
      return {
        exists: false,
        cursedBond: ethers.constants.Zero,
        freeBond: ethers.constants.Zero,
        maximumRewrapInterval: ethers.constants.Zero,
        maximumResurrectionTime: ethers.constants.Zero,
        minimumDiggingFeePerSecond: ethers.constants.Zero,
        peerId: "",
      };
    } else throw e;
  }
}

export async function getRewards(web3Interface: Web3Interface): Promise<BigNumber> {
  return web3Interface.viewStateFacet.getRewards(web3Interface.ethWallet.address);
}

export async function getSarcoBalance(web3Interface: Web3Interface): Promise<BigNumber> {
  return web3Interface.sarcoToken.balanceOf(web3Interface.ethWallet.address);
}

export async function getGracePeriod(web3Interface: Web3Interface): Promise<BigNumber> {
  return web3Interface.viewStateFacet.getGracePeriod();
}

export async function getEthBalance(web3Interface: Web3Interface): Promise<BigNumber> {
  return web3Interface.ethWallet.getBalance();
}

export async function getFreeBondBalance(web3Interface: Web3Interface): Promise<BigNumber> {
  return web3Interface.viewStateFacet.getFreeBond(web3Interface.ethWallet.address);
}

export async function getSarcophagiIds(web3Interface: Web3Interface): Promise<string[]> {
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
