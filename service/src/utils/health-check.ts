import { constants, ethers } from "ethers";
import { exit } from "process";
import { Web3Interface } from "scripts/web3-interface";
import { RPC_EXCEPTION } from "./exit-codes";

export async function healthCheck(web3Interface: Web3Interface) {
    try {
        // Query the contracts to get the archaeologists free bond value.If free bond is 0, spit out a warning on the console to tell the user they will not be able to accept new jobs.
        // Check the archaeologists local ETH balance.If the balance is 0, the archaeologist won't be able to sign any transactions (or do unwrappings). At this point, lets just show a warning for this.
        const bal = await web3Interface.sarcoToken.balanceOf(await web3Interface.signer.getAddress());
        const freeBond = await web3Interface.viewStateFacet.getFreeBond(await web3Interface.signer.getAddress());
        const ethBal = await web3Interface.signer.getBalance();

        console.log("\n\n=========================================================================================================");
        console.log(" YOUR BALANCES:\n");

        console.log(` * SARCO:             ${ethers.utils.formatEther(bal)} SARCO`,);
        console.log(` * ETHER:             ${ethers.utils.formatEther(ethBal)} ETH`,);
        if (ethBal.eq(constants.Zero)) {
            console.log(`\n   You will not be able to sign any transactions (or do unwrappings)!\n`);
        }

        console.log(` * Free Bond:         ${ethers.utils.formatEther(freeBond)} SARCO`,);
        if (freeBond.eq(constants.Zero)) {
            console.log(`\n   You will not be able to accept new jobs!`);
            console.log(`   Run: \`npm run start -- --deposit-bond:<amount>\` to deposit some SARCO\n`);
        }
        console.log("=========================================================================================================\n\n");
    } catch (e) {
        console.error(e);
        exit(RPC_EXCEPTION);
    }
}