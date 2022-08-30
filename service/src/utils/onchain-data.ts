import { BigNumber } from "ethers";
import { Web3Interface } from "scripts/web3-interface";

interface InMemoryStore {
    sarcophagi?: string[],
    profile?: {
        exists: boolean;
        minimumDiggingFee: BigNumber;
        maximumRewrapInterval: BigNumber;
        freeBond: BigNumber;
        cursedBond: BigNumber;
        rewards: BigNumber;
    }
}

export const inMemoryStore: InMemoryStore = {};

export async function retrieveOnchainData(web3Interface: Web3Interface) {
    inMemoryStore.sarcophagi = await web3Interface.viewStateFacet.getArchaeologistSarcophagi(web3Interface.ethWallet.address);
    inMemoryStore.profile = await web3Interface.viewStateFacet.getArchaeologistProfile(web3Interface.ethWallet.address);
}