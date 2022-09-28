import { exit } from "process";
import { Web3Interface } from "scripts/web3-interface";
import { archLogger } from "./chalk-theme";
import { RPC_EXCEPTION } from "./exit-codes";
import { inMemoryStore } from "./onchain-data";
import { scheduleUnwrap } from "./scheduler";

function getCreateSarcoHandler(web3Interface: Web3Interface, archAddress: string) {
    return (
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
            inMemoryStore.sarcophagi.push({ id: sarcoId, resurrectionTime: resurrectionDate });
        }
    }
}

function getRewrapHandler(web3Interface: Web3Interface) {
    return (sarcoId, newResurrectionTime) => {
        const isCursed = inMemoryStore.sarcophagi.findIndex(s => s.id === sarcoId) !== -1
        if (isCursed) {
            const newResurrectionDate = new Date(newResurrectionTime as number);
            scheduleUnwrap(web3Interface, sarcoId, newResurrectionDate);
        }
    }
}

function getCleanHandler() {
    return (sarcoId: string, _) => {
        archLogger.info(`Sarcophagus cleaned: ${sarcoId}`);
        inMemoryStore.sarcophagi = inMemoryStore.sarcophagi.filter(s => s.id !== sarcoId);
    }
}

function getBuryHandler() {
    return (sarcoId: string, _) => {
        archLogger.info(`Sarcophagus buried: ${sarcoId}`);
        inMemoryStore.sarcophagi = inMemoryStore.sarcophagi.filter(s => s.id !== sarcoId);
    }
}

export async function setupEventListeners(web3Interface: Web3Interface) {
    try {
        const archAddress = web3Interface.ethWallet.address;

        const filters = {
            createSarco: web3Interface.embalmerFacet.filters.CreateSarcophagus(),
            rewrap: web3Interface.embalmerFacet.filters.RewrapSarcophagus(),
            clean: web3Interface.thirdPartyFacet.filters.CleanUpSarcophagus(),
            bury: web3Interface.embalmerFacet.filters.BurySarcophagus(),
        };

        const handlers = {
            createSarco: getCreateSarcoHandler(web3Interface, archAddress),
            rewrap: getRewrapHandler(web3Interface),
            clean: getCleanHandler(),
            bury: getBuryHandler(),
        };

        web3Interface.embalmerFacet.on(filters.createSarco, handlers.createSarco);
        web3Interface.embalmerFacet.on(filters.rewrap, handlers.rewrap);
        web3Interface.embalmerFacet.on(filters.clean, handlers.clean);
        web3Interface.embalmerFacet.on(filters.bury, handlers.bury);
    } catch (e) {
        console.error(e);
        exit(RPC_EXCEPTION);
    }
}