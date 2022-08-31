import { BigNumber } from "ethers";
import { Web3Interface } from "scripts/web3-interface";

export interface OnchainProfile {
    exists: boolean;
    minimumDiggingFee: BigNumber;
    maximumRewrapInterval: BigNumber;
    freeBond: BigNumber;
    cursedBond: BigNumber;
    rewards: BigNumber;
}

interface InMemoryStore {
    sarcophagi?: string[],
    profile?: OnchainProfile
}

export const inMemoryStore: InMemoryStore = {};

export async function retrieveOnchainData(web3Interface: Web3Interface) {
    inMemoryStore.sarcophagi = await web3Interface.viewStateFacet.getArchaeologistSarcophagi(web3Interface.ethWallet.address);
    inMemoryStore.profile = await getOnchainProfile(web3Interface);
}

export async function getOnchainProfile(web3Interface: Web3Interface): Promise<OnchainProfile> {
    return await web3Interface.viewStateFacet.getArchaeologistProfile(web3Interface.ethWallet.address);
}