import { BigNumber } from "ethers";
import { Web3Interface } from "scripts/web3-interface";
import { fetchSarcophagiAndSchedulePublish } from "./blockchain/refresh-data";

export interface OnchainProfile {
  exists: boolean;
  minimumDiggingFee: BigNumber;
  maximumRewrapInterval: BigNumber;
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
  sarcoIdsInProcessOfHavingKeySharesPublished: string[];
  profile?: OnchainProfile;
  gracePeriod?: BigNumber;
}

export const inMemoryStore: InMemoryStore = {
  sarcophagi: [],
  sarcoIdsInProcessOfHavingKeySharesPublished: []
};

export async function fetchProfileAndSchedulePublish(web3Interface: Web3Interface) {
  inMemoryStore.profile = await getOnchainProfile(web3Interface);
  inMemoryStore.sarcophagi = await fetchSarcophagiAndSchedulePublish(web3Interface);
}

export async function getOnchainProfile(web3Interface: Web3Interface): Promise<OnchainProfile> {
  return web3Interface.viewStateFacet.getArchaeologistProfile(web3Interface.ethWallet.address);
}

export async function getSarcoBalance(web3Interface: Web3Interface): Promise<BigNumber> {
  return web3Interface.sarcoToken.balanceOf(web3Interface.ethWallet.address);
}

export async function getGracePeriod(web3Interface: Web3Interface): Promise<BigNumber> {
  return web3Interface.viewStateFacet.getGracePeriod();
}

export async function getEthBalance(web3Interface: Web3Interface): Promise<BigNumber> {
  return web3Interface.signer.getBalance();
}

export async function getFreeBondBalance(web3Interface: Web3Interface): Promise<BigNumber> {
  return web3Interface.viewStateFacet.getFreeBond(web3Interface.ethWallet.address);
}

export async function getSarcophagiIds(web3Interface: Web3Interface): Promise<string[]> {
  return web3Interface.viewStateFacet.getArchaeologistSarcophagi(
    web3Interface.ethWallet.address
  );
}

export enum SarcophagusState {
  DoesNotExist,
  Active,
  Resurrecting,
  Resurrected,
  Buried,
  Cleaned,
  Accused,
  Failed
}
