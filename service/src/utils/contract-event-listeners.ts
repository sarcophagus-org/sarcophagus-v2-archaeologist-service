import { exit } from "process";
import { Web3Interface } from "scripts/web3-interface";
import { RPC_EXCEPTION } from "./exit-codes";
import { inMemoryStore, SarcophagusData } from "./onchain-data";

const waitingForFinalise: SarcophagusData[] = [];

export async function setupEventListeners(web3Interface: Web3Interface) {
    try {
        const archAddress = web3Interface.ethWallet.address;

        const initialiseFilter = web3Interface.embalmerFacet.filters.InitializeSarcophagus();
        web3Interface.embalmerFacet.on(initialiseFilter, (
            sarcoId,
            sarcoName,
            transferrable,
            resurrectionTime,
            embalmer,
            recipient,
            arweaveArch,
            cursedArchs,
            totalFees
        ) => {
            const isCursed = (cursedArchs as string[]).includes(archAddress);
            if (isCursed) {
                waitingForFinalise.push({ id: sarcoId, resurrectionTime });
            }
        }
        );

        const finaliseFilter = web3Interface.embalmerFacet.filters.FinalizeSarcophagus();
        web3Interface.embalmerFacet.on(finaliseFilter, (sarcoId: string, arweaveTxId) => {
            // TODO: waitingForFinalise to be removed when contracts merge initialize and finalize
            const i = waitingForFinalise.findIndex(s => s.id === sarcoId);
            if (i !== -1) {
                const sarco = waitingForFinalise.splice(i, 1)[0];
                inMemoryStore.sarcophagi?.push(sarco);
            }
        });

        const rewrapFilter = web3Interface.embalmerFacet.filters.RewrapSarcophagus();
        web3Interface.embalmerFacet.on(rewrapFilter, (sarcoId, newResurrectionTime) => {
            console.log(`On rewrap \n${newResurrectionTime}`);
            // do sth with newResurrectionTime
        });

        const cleanFilter = web3Interface.thirdPartyFacet.filters.CleanUpSarcophagus();
        web3Interface.embalmerFacet.on(cleanFilter, (_, __) => console.log(`On clean \n${_}\n${__}`));

        const buryFilter = web3Interface.embalmerFacet.filters.BurySarcophagus();
        web3Interface.embalmerFacet.on(buryFilter, (_, __) => console.log(`On bury \n${_}\n${__}`));

        const cancelFilter = web3Interface.embalmerFacet.filters.CancelSarcophagus();
        web3Interface.embalmerFacet.on(cancelFilter, (_, __) => console.log(`On cancel \n${_}\n${__}`));
    } catch (e) {
        console.error(e);
        exit(RPC_EXCEPTION);
    }
}