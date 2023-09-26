import { BigNumber } from "ethers";
import { getWeb3Interface } from "../scripts/web3-interface";
import { fetchSarcophagiAndSchedulePublish } from "./blockchain/refresh-data";
import { SubgraphData } from "./graphql";
import { SarcoSupportedNetwork } from "@sarcophagus-org/sarcophagus-v2-sdk";

export interface OnchainProfile {
  exists: boolean;
  minimumDiggingFeePerSecond: BigNumber;
  maximumRewrapInterval: BigNumber;
  maximumResurrectionTime: BigNumber;
  freeBond: BigNumber;
  cursedBond: BigNumber;
  peerId: string;
  curseFee: BigNumber;
}

export interface SarcophagusData {
  id: string;
  creationDate: Date;
  resurrectionTime: Date;
  perSecondFee: BigNumber;
  cursedAmount: BigNumber;
  name?: string;
  cursedArchaeologist?: CursedArchaeologist[];
}

export interface SarcophagusContract {
  resurrectionTime: BigNumber;
  previousRewrapTime: BigNumber;
  isCompromised: boolean;
  isCleaned: boolean;
  name: string;
  threshold: BigNumber;
  maximumRewrapInterval: BigNumber;
  maximumResurrectionTime: BigNumber;
  cursedBondPercentage: BigNumber;
  arweaveTxId: string;
  embalmerAddress: string;
  recipientAddress: string;
  archaeologistAddresses: string[];
  publishedPrivateKeyCount: BigNumber;
  hasLockedBond: boolean;
}

export interface CursedArchaeologist {
  diggingFeePerSecond: BigNumber;
  privateKey: string;
  publicKey: string;
  isAccused: boolean;
  curseFee: BigNumber;
}

export interface SarcophagusDataSimple {
  id: string;
  curseStatus: string;
  creationDate: Date;
  resurrectionTime: Date;
}

interface InMemoryStore {
  sarcophagi: SarcophagusData[];
  deadSarcophagusIds: string[];
  sarcoIdsInProcessOfHavingPrivateKeyPublished: string[];
  profile?: OnchainProfile;
  gracePeriod?: BigNumber;
}

export const inMemoryStore: InMemoryStore = {
  sarcophagi: [],
  deadSarcophagusIds: [],
  sarcoIdsInProcessOfHavingPrivateKeyPublished: [],
};

export async function fetchProfileAndSchedulePublish(network?: SarcoSupportedNetwork) {
  inMemoryStore.profile = await getOnchainProfile(network);
  inMemoryStore.sarcophagi = await fetchSarcophagiAndSchedulePublish();
}

export async function getOnchainProfile(network?: SarcoSupportedNetwork): Promise<OnchainProfile> {
  const web3Interface = await getWeb3Interface();
  const { viewStateFacet, ethWallet } = web3Interface.getNetworkContext(network);

  try {
    return {
      exists: true,
      ...(await viewStateFacet.getArchaeologistProfile(
        ethWallet.address
      )),
    };
  } catch (e) {
    if (e.errorName === "ArchaeologistProfileExistsShouldBe" && e.errorArgs.includes(true)) {
      return { exists: false } as OnchainProfile;
    } else throw e;
  }
}

export async function getRewards(network?: SarcoSupportedNetwork): Promise<BigNumber> {
  const web3Interface = await getWeb3Interface();
  const { viewStateFacet, ethWallet } = web3Interface.getNetworkContext(network);
  return viewStateFacet.getRewards(ethWallet.address);
}

export async function getSarcoBalance(network?: SarcoSupportedNetwork): Promise<BigNumber> {
  const web3Interface = await getWeb3Interface();
  const { sarcoToken, ethWallet } = web3Interface.getNetworkContext(network);
  return sarcoToken.balanceOf(ethWallet.address);
}

export async function getGracePeriod(network?: SarcoSupportedNetwork): Promise<BigNumber> {
  const web3Interface = await getWeb3Interface();
  const { viewStateFacet } = web3Interface.getNetworkContext(network);
  return viewStateFacet.getGracePeriod();
}

export async function getEthBalance(network?: SarcoSupportedNetwork): Promise<BigNumber> {
  const web3Interface = await getWeb3Interface();
  const { ethWallet } = web3Interface.getNetworkContext(network);
  return ethWallet.getBalance();
}

export async function getFreeBondBalance(network?: SarcoSupportedNetwork): Promise<BigNumber> {
  const web3Interface = await getWeb3Interface();
  const { viewStateFacet, ethWallet } = web3Interface.getNetworkContext(network);
  return viewStateFacet.getFreeBond(ethWallet.address);
}

export async function getSarcophagiIds(network?: SarcoSupportedNetwork): Promise<string[]> {
  const web3Interface = await getWeb3Interface();
  const { ethWallet } = web3Interface.getNetworkContext(network);
  return SubgraphData.getSarcophagiIds(ethWallet.address.toLowerCase());
}
