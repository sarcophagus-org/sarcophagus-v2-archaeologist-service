import { exit } from "process";
import { Web3Interface } from "scripts/web3-interface";
import { archLogger } from "./chalk-theme";
import { RPC_EXCEPTION } from "./exit-codes";
import { inMemoryStore } from "./onchain-data";
import { rescheduleUnwrap, scheduleUnwrap } from "./scheduler";

export async function setupEventListeners(web3Interface: Web3Interface) {
    try {
        const archAddress = web3Interface.ethWallet.address;

        const createSarcoFilter = web3Interface.embalmerFacet.filters.CreateSarcophagus();
        web3Interface.embalmerFacet.on(createSarcoFilter, (
            sarcoId,
            sarcoName,
            transferrable,
            resurrectionTime,
            embalmer,
            recipient,
            cursedArchs,
            totalFees,
            arweaveTxIds
        ) => {
            const isCursed = (cursedArchs as string[]).includes(archAddress);
            if (isCursed) {
                const resurrectionDate = new Date(resurrectionTime as number);
                scheduleUnwrap(web3Interface, sarcoId, resurrectionDate);
            }
        });

        const rewrapFilter = web3Interface.embalmerFacet.filters.RewrapSarcophagus();
        web3Interface.embalmerFacet.on(rewrapFilter, (sarcoId, newResurrectionTime) => {
            const newResurrectionDate = new Date(newResurrectionTime as number);
            rescheduleUnwrap(web3Interface, sarcoId, newResurrectionDate);
        });

        const cleanFilter = web3Interface.thirdPartyFacet.filters.CleanUpSarcophagus();
        web3Interface.embalmerFacet.on(cleanFilter, (sarcoId: string, _) => {
            archLogger.info(`Sarcophagus cleaned: ${sarcoId}`);
            inMemoryStore.sarcophagi = inMemoryStore.sarcophagi.filter(s => s.id !== sarcoId);
        });

        const buryFilter = web3Interface.embalmerFacet.filters.BurySarcophagus();
        web3Interface.embalmerFacet.on(buryFilter, (sarcoId: string, _) => {
            archLogger.info(`Sarcophagus buried: ${sarcoId}`);
            inMemoryStore.sarcophagi = inMemoryStore.sarcophagi.filter(s => s.id !== sarcoId);
        });
    } catch (e) {
        console.error(e);
        exit(RPC_EXCEPTION);
    }
}