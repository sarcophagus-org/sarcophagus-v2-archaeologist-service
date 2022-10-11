import { constants, ethers } from "ethers";
import { exit } from "process";
import { Web3Interface } from "scripts/web3-interface";
import { archLogger } from "../logger/chalk-theme";
import { RPC_EXCEPTION } from "./exit-codes";
import { logBalance, logCallout } from "../logger/formatter";

// Query the contracts to get the archaeologists free bond value.If free bond is 0, spit out a warning on the console to tell the user they will not be able to accept new jobs.
// Check the archaeologists local ETH balance. If the balance is 0, the archaeologist won't be able to sign any transactions (or do unwrappings). At this point, lets just show a warning for this.
export async function healthCheck(web3Interface: Web3Interface) {
  try {
    const sarcoBal = await web3Interface.sarcoToken.balanceOf(web3Interface.ethWallet.address);
    const freeBondBal = await web3Interface.viewStateFacet.getFreeBond(
      web3Interface.ethWallet.address
    );
    const ethBal = await web3Interface.signer.getBalance();

    logCallout(() => {
        console.log(" YOUR BALANCES:\n");

        logBalance('SARCO', sarcoBal, 'SARCO');
        logBalance('ETHER', ethBal, 'ETH');
        if (ethBal.lte(ethers.utils.parseEther("0.0005"))) {
          archLogger.warn(
            `\n   You have very little ETH in your account. You may not be able to sign any transactions (or do unwrappings)!\n`
          );
        }

        logBalance('Free Bond', freeBondBal, 'SARCO');
        if (freeBondBal.eq(constants.Zero)) {
          archLogger.warn(`\n   You have no free bond. You will not be able to accept new jobs!`);
          archLogger.error(
            `   Run: \`npm run start -- --deposit-bond:<amount>\` to deposit some SARCO\n`
          );
        }
      }
    )

  } catch (e) {
    archLogger.error(e);
    exit(RPC_EXCEPTION);
  }
}
