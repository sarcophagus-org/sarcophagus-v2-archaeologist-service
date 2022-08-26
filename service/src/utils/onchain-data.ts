import { Web3Interface } from "scripts/web3-interface";

export const storage: {
    sarcophagi?: string[],
} = {};

export async function retrieveOnchainData(web3Interface: Web3Interface) {
    const sarcoCursed = await web3Interface.viewStateFacet.getArchaeologistsarcophagi(web3Interface.ethWallet.address)
    storage.sarcophagi = sarcoCursed;
}