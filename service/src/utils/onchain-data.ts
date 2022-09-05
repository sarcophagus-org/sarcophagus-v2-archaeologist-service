import { BigNumber } from "ethers";
import { Web3Interface } from "scripts/web3-interface";
import { fetchAndDecryptShard } from "./arweave";
import { archLogger } from "./chalk-theme";
import { handleRpcError } from "./rpc-error-handler";

interface OnchainProfile {
    exists: boolean;
    minimumDiggingFee: BigNumber;
    maximumRewrapInterval: BigNumber;
    freeBond: BigNumber;
    cursedBond: BigNumber;
    rewards: BigNumber;
}

export interface SarcophagusData {
    id: string,
    resurrectionTime: Date
}

interface InMemoryStore {
    sarcophagi: SarcophagusData[],
    unwrappedSarcophagi: string[],
    profile?: OnchainProfile
}

export const inMemoryStore: InMemoryStore = {
    sarcophagi: [],
    unwrappedSarcophagi: [],
};

export async function retrieveOnchainData(web3Interface: Web3Interface) {
    inMemoryStore.sarcophagi = await getOnchainCursedSarcophagi(web3Interface);
    inMemoryStore.profile = await getOnchainProfile(web3Interface);
}

export async function getOnchainProfile(web3Interface: Web3Interface): Promise<OnchainProfile> {
    return await web3Interface.viewStateFacet.getArchaeologistProfile(web3Interface.ethWallet.address);
}

export async function getOnchainCursedSarcophagi(web3Interface: Web3Interface): Promise<SarcophagusData[]> {
    const archSarco: SarcophagusData[] = [];

    const sarcoIds = await web3Interface.viewStateFacet.getArchaeologistSarcophagi(web3Interface.ethWallet.address);
    sarcoIds.map(async sarcoId => {
        const sarco = await web3Interface.viewStateFacet.getSarcophagus(sarcoId);

        if (sarco.state === SarcophagusState.Exists) {
            // only add sarco that have state === EXISTS
            archSarco.push({
                id: sarcoId,
                resurrectionTime: new Date(sarco.resurrectionTime.toNumber() * 1000),
            });
        }
    });

    return archSarco;
}

export async function unwrapSarcophagus(web3Interface: Web3Interface, sarcoId: string) {
    archLogger.notice(`Unwrapping sarcophagus ${sarcoId}`);

    const decryptedShard = await fetchAndDecryptShard(web3Interface, sarcoId);

    if (!decryptedShard) {
        archLogger.error("Unwrap failed -- unable to decrypt shard");
        return;
    }

    try {
        await web3Interface.archaeologistFacet.unwrapSarcophagus(sarcoId, decryptedShard);

        inMemoryStore.unwrappedSarcophagi.push(sarcoId);
        archLogger.notice("Unwrapped successfully!");
    } catch (e) {
        archLogger.error("Unwrap failed");
        handleRpcError(e.reason);
    }
}

export enum SarcophagusState {
    DoesNotExist,
    Exists,
    Done
}