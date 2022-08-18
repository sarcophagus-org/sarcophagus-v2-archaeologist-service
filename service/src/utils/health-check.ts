import { ethers } from "ethers";
import { exit } from "process";
import { Web3Interface } from "scripts/web3-interface";
import { RPC_EXCEPTION } from "./exit-codes";

export async function healthCheck(web3Interface: Web3Interface) {
    try {
        // Query the contracts to get the archaeologists free bond value.If free bond is 0, spit out a warning on the console to tell the user they will not be able to accept new jobs.
        // Check the archaeologists local ETH balance.If the balance is 0, the archaeologist won't be able to sign any transactions (or do unwrappings). At this point, lets just show a warning for this.
        const bal = await web3Interface.sarcoToken.balanceOf(web3Interface.wallet.address);
        const freeBond = await web3Interface.viewStateFacet.getFreeBond(web3Interface.wallet.address);
        const ethBal = await web3Interface.signer.getBalance();

        console.log("\n\n=========================================================================================================");
        console.log(" YOUR BALANCES:\n");

        console.log(` * SARCO:             ${ethers.utils.formatEther(bal)} SARCO`,);
        console.log(` * ETHER:             ${ethers.utils.formatEther(ethBal)} ETH`,);
        // if (ethBal.eq(constants.Zero)) {
        console.log(`\n   You will not be able to sign any transactions (or do unwrappings)!\n`);
        // }

        console.log(` * Free Bond:         ${ethers.utils.formatEther(freeBond)} SARCO`,);
        // if (freeBond.eq(constants.Zero)) {
        console.log(`\n   You will not be able to accept new jobs!`);
        console.log(`   Run: \`npm run start -- --deposit-bond:<amount>\` to deposit some SARCO\n`);
        // }
        console.log("=========================================================================================================\n\n");
    } catch (e) {
        if (e.reason) {
            handleRpcError(e.reason);
        }
        else {
            console.error(e);
        }
        exit(RPC_EXCEPTION);
    }
}

function handleRpcError(error: string) {
    if (error.includes("NotEnoughFreeBond")) {
        const a = error.indexOf("(") + 1;
        const b = error.indexOf(",");

        const available = error.substring(a, b);
        console.error(`\nNot enough free bond. Available: ${ethers.utils.formatEther(available)} SARCO`,)
    } else if (error.includes("NotEnoughReward")) {
        const a = error.indexOf("(") + 1;
        const b = error.indexOf(",");

        const available = error.substring(a, b);
        console.error(`\nNot enough reward. Available: ${ethers.utils.formatEther(available)} SARCO`,)
    } else {
        console.error(error);
    }
}