import { ethers } from "ethers";
import { archLogger } from "./chalk-theme";

const alreadyUnwrapped = (e: string) => e.includes("ArchaeologistAlreadyUnwrapped");
const notEnoughFreeBond = (e: string) => e.includes("NotEnoughFreeBond");
const notEnoughReward = (e: string) => e.includes("NotEnoughReward");
const insufficientAllowance = (e: string) => e.includes("insufficient allowance");
const profileShouldExist = (e: string) => e.includes("ArchaeologistProfileExistsShouldBe(true");
const lowSarcoBalance = (e: string) => e.includes("transfer amount exceeds balance");


/** 
 * Parses the text in RPC errors' `.reason` field and outputs more readable error messages
 * */
export function handleRpcError(e: string) {
    if (alreadyUnwrapped(e)) {
        archLogger.error(`\nAlready unwrapped this Sarcophagus`);
        return;
    }

    if (profileShouldExist(e)) {
        archLogger.error(`\nProfile not registered`);
        archLogger.error(`Use \`npm run register\` to register your archaeologist profile. See readme for details on usage\n`);
        return;
    }

    if (notEnoughFreeBond(e)) {
        const a = e.indexOf("(") + 1;
        const b = e.indexOf(",");

        const available = e.substring(a, b);
        archLogger.error(`\nNot enough free bond. Available: ${ethers.utils.formatEther(available)} SARCO`);
        return;
    }

    if (notEnoughReward(e)) {
        const a = e.indexOf("(") + 1;
        const b = e.indexOf(",");

        const available = e.substring(a, b);
        archLogger.error(`\nNot enough reward. Available: ${ethers.utils.formatEther(available)} SARCO`);
        return;
    }

    if (insufficientAllowance(e)) {
        archLogger.error(`\nTransaction reverted: Insufficient allowance`);
        archLogger.error(`Run \`npm run approve\` to grant Sarcophagus contracts permission to transfer your SARCO tokens.`);
        return;
    }

    if (lowSarcoBalance(e)) {
        archLogger.error(`\nInsufficient balance`);
        archLogger.error(`Add some SARCO to your account to continue`);
        return;
    }

    archLogger.error(`\n${e}`);
}