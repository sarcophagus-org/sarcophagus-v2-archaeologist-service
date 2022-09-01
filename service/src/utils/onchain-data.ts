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

interface SarchophagusData {
    id: string,
    resurrectionTime: Date
}

interface InMemoryStore {
    sarcophagi?: SarchophagusData[],
    profile?: OnchainProfile
}

export const inMemoryStore: InMemoryStore = {};

export async function retrieveOnchainData(web3Interface: Web3Interface) {
    const archSarco: SarchophagusData[] = [];

    const sarcoIds = await web3Interface.viewStateFacet.getArchaeologistSarcophagi(web3Interface.ethWallet.address);
    sarcoIds.map(async sarcoId => {
        const sarco = await web3Interface.viewStateFacet.getSarcophagus(sarcoId);
        archSarco.push({
            id: sarcoId,
            resurrectionTime: new Date(sarco.resurrectionTime.toNumber() * 1000),
        });
    });

    inMemoryStore.sarcophagi = archSarco;
    inMemoryStore.profile = await getOnchainProfile(web3Interface);
}

export async function getOnchainProfile(web3Interface: Web3Interface): Promise<OnchainProfile> {
    return await web3Interface.viewStateFacet.getArchaeologistProfile(web3Interface.ethWallet.address);
}