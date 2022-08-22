import { constants, ethers } from "ethers";
import { exit } from "process";
import { Web3Interface } from "scripts/web3-interface";
import { archLogger } from "./chalk-theme";
import { RPC_EXCEPTION } from "./exit-codes";


export async function healthCheck(web3Interface: Web3Interface) {
    try {
        // Query the contracts to get the archaeologists free bond value.If free bond is 0, spit out a warning on the console to tell the user they will not be able to accept new jobs.
        // Check the archaeologists local ETH balance.If the balance is 0, the archaeologist won't be able to sign any transactions (or do unwrappings). At this point, lets just show a warning for this.
        const bal = await web3Interface.sarcoToken.balanceOf(web3Interface.wallet.address);
        const freeBond = await web3Interface.viewStateFacet.getFreeBond(web3Interface.wallet.address);
        const ethBal = await web3Interface.signer.getBalance();

        console.log("\n\n=========================================================================================================\n");
        console.log(" YOUR BALANCES:\n");

        console.log(` * SARCO:             ${ethers.utils.formatEther(bal)} SARCO`,);
        console.log(` * ETHER:             ${ethers.utils.formatEther(ethBal)} ETH`,);
        if (ethBal.eq(constants.Zero)) {
            archLogger.warn(`\n   You have no ETH in your account. You will not be able to sign any transactions (or do unwrappings)!\n`);
        }

        console.log(` * Free Bond:         ${ethers.utils.formatEther(freeBond)} SARCO`,);
        if (freeBond.eq(constants.Zero)) {
            archLogger.warn(`\n   You have no free bond. You will not be able to accept new jobs!`);
            archLogger.error(`   Run: \`npm run start -- --deposit-bond:<amount>\` to deposit some SARCO\n`);
        }
        console.log("\n=========================================================================================================\n\n");
    } catch (e) {
        archLogger.error(e);
        exit(RPC_EXCEPTION);
    }
}