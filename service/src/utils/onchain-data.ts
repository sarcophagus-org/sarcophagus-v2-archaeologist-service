import { BigNumber } from "ethers";
import { Web3Interface } from "scripts/web3-interface";
import { fetchAndDecryptShard } from "./arweave";
import { archLogger } from "./chalk-theme";
import { handleRpcError } from "./rpc-error-handler";
import { scheduleUnwrap } from "./scheduler";

interface OnchainProfile {
    exists: boolean;
    minimumDiggingFee: BigNumber;
    maximumRewrapInterval: BigNumber;
    freeBond: BigNumber;
    cursedBond: BigNumber;
    peerId: string;
}

interface SarcophagusData {
    id: string,
    resurrectionTime: Date
}

interface InMemoryStore {
    sarcophagi: SarcophagusData[],
    profile?: OnchainProfile
}

export const inMemoryStore: InMemoryStore = {
    sarcophagi: []
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
        const archStorage = await web3Interface.viewStateFacet.getSarcophagusArchaeologist(sarcoId, web3Interface.ethWallet.address);

        if (sarco.state === SarcophagusState.Exists && !archStorage.unencryptedShard) {
            const nowTimestamp = (new Date()).getUTCSeconds();
            // TODO: rename resurrectionWindow to gracePeriod when contract updates merged
            const tooLateToUnrap = sarco.resurrectionTime.toNumber() + sarco.resurrectionWindow.toNumber() < nowTimestamp;

            if (tooLateToUnrap) {
                archLogger.warn(`You failed to unwrap a Sarcophagus ${sarcoId}\n`);
                // TODO: archaeologist might want to call clean here

                return;
            }

            // only add unwrappable sarco that have state === EXISTS and haven't already unwrapped (uploaded their unencrypted shard)
            const resurrectionTime = new Date(sarco.resurrectionTime.toNumber() * 1000);
            archSarco.push({
                id: sarcoId,
                resurrectionTime,
            });

            // Schedule an uwrap job for each sarco this arch is cursed on. `scheduleUnwrap` will cancel existing 
            // schedules, so no duplicate jobs will be created.
            scheduleUnwrap(web3Interface, sarcoId, resurrectionTime);
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

        inMemoryStore.sarcophagi = inMemoryStore.sarcophagi.filter(s => s.id !== sarcoId);
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