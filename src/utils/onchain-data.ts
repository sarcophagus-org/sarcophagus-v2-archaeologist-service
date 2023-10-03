import { BigNumber } from "ethers";
import { fetchSarcophagiAndSchedulePublish } from "./blockchain/refresh-data";
import { SubgraphData } from "./graphql";
import { NetworkContext } from "../network-config";

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

export const inMemoryStore: Map<number, InMemoryStore> = new Map([]);

export async function fetchProfileAndSchedulePublish(networkContext: NetworkContext) {
  let networkProfile = inMemoryStore.get(networkContext.chainId) || {
    sarcophagi: [],
    deadSarcophagusIds: [],
    sarcoIdsInProcessOfHavingPrivateKeyPublished: [],
  };

  if (!inMemoryStore.get(networkContext.chainId)?.gracePeriod) {
    networkProfile.gracePeriod = await getGracePeriod(networkContext);
  }
  networkProfile.profile = await getOnchainProfile(networkContext);
  networkProfile.sarcophagi = await fetchSarcophagiAndSchedulePublish(networkContext);

  console.log(`Set ${networkContext.networkName} profile maximumResurrectionTime to ${networkProfile.profile.maximumResurrectionTime}`);
  
  inMemoryStore.set(networkContext.chainId, networkProfile);
}

export async function getOnchainProfile(networkContext: NetworkContext): Promise<OnchainProfile> {
  const { viewStateFacet, ethWallet } = networkContext;

  try {
    return {
      exists: true,
      ...(await viewStateFacet.getArchaeologistProfile(ethWallet.address)),
    };
  } catch (e) {
    if (e.errorName === "ArchaeologistProfileExistsShouldBe" && e.errorArgs.includes(true)) {
      return { exists: false } as OnchainProfile;
    } else throw e;
  }
}

export async function getRewards(networkContext: NetworkContext): Promise<BigNumber> {
  const { viewStateFacet, ethWallet } = networkContext;
  return viewStateFacet.getRewards(ethWallet.address);
}

export async function getSarcoBalance(networkContext: NetworkContext): Promise<BigNumber> {
  const { sarcoToken, ethWallet } = networkContext;
  return sarcoToken.balanceOf(ethWallet.address);
}

export async function getGracePeriod(networkContext: NetworkContext): Promise<BigNumber> {
  const { viewStateFacet } = networkContext;
  return viewStateFacet.getGracePeriod();
}

export async function getNetworkTokenBalance(networkContext: NetworkContext): Promise<BigNumber> {
  const { ethWallet } = networkContext;
  return ethWallet.getBalance();
}

export async function getFreeBondBalance(networkContext: NetworkContext): Promise<BigNumber> {
  const { viewStateFacet, ethWallet } = networkContext;
  return viewStateFacet.getFreeBond(ethWallet.address);
}

export async function getSarcophagiIds(networkContext: NetworkContext): Promise<string[]> {
  const { ethWallet } = networkContext;
  return SubgraphData.getSarcophagiIds(ethWallet.address.toLowerCase(), networkContext);
}
