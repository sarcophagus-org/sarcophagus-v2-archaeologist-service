import { ethers } from "ethers";
import { archLogger } from "./chalk-theme";


/** 
 * Parses the text in RPC errors' `.reason` field and outputs more readable error messages
 * */
export function handleRpcError(error: string) {
    if (error.includes("ArchaeologistProfileExistsShouldBe(true")) {
        archLogger.error(`\nProfile not registered`);
        archLogger.error(`Use \`npm run register\` to register your archaeologist profile. See readme for details on usage\n`);
        return;
    }

    if (error.includes("NotEnoughFreeBond")) {
        const a = error.indexOf("(") + 1;
        const b = error.indexOf(",");

        const available = error.substring(a, b);
        archLogger.error(`\nNot enough free bond. Available: ${ethers.utils.formatEther(available)} SARCO`);
        return;
    }

    if (error.includes("NotEnoughReward")) {
        const a = error.indexOf("(") + 1;
        const b = error.indexOf(",");

        const available = error.substring(a, b);
        archLogger.error(`\nNot enough reward. Available: ${ethers.utils.formatEther(available)} SARCO`);
        return;
    }

    if (error.includes("insufficient allowance")) {
        archLogger.error(`\nTransaction reverted: Insufficient allowance`);
        archLogger.error(`Run \`npm run approve\` to grant Sarcophagus contracts permission to transfer your SARCO tokens.`);
        return;
    }

    if (error.includes("transfer amount exceeds balance")) {
        archLogger.error(`\nInsufficient balance`);
        archLogger.error(`Add some SARCO to your account to continue`);
        return;
    }

    archLogger.error(`\n${error}`);
}