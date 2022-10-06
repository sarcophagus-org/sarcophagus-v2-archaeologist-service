import { ethers } from "ethers";
import { archLogger } from "./chalk-theme";

const alreadyUnwrapped = (e: string) => e.includes("ArchaeologistAlreadyUnwrapped");
const notEnoughFreeBond = (e: string) => e.includes("NotEnoughFreeBond");
const notEnoughReward = (e: string) => e.includes("NotEnoughReward");
const insufficientAllowance = (e: string) => e.includes("insufficient allowance");
const profileShouldExist = (e: string) => e.includes("ArchaeologistProfileExistsShouldBe(true");
const lowSarcoBalance = (e: string) => e.includes("transfer amount exceeds balance");
const badlyFormattedHash = (e: string) => e.includes("invalid arrayify value");
const sarcoDoesNotExist = (e: string) => e.includes("SarcophagusDoesNotExist");
const sarcoNotCleanable = (e: string) => e.includes("SarcophagusNotCleanable");
const sarcoIsActuallyUnwrappable = (e: string) => e.includes("SarcophagusIsUnwrappable");
const notEnoughProof = (e: string) => e.includes("AccuseNotEnoughProof");
const incorrectProof = (e: string) => e.includes("AccuseIncorrectProof");

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
    archLogger.error(
      `Use \`npm run register\` to register your Archaeologist profile. See readme for details on usage\n`
    );
    return;
  }

  if (notEnoughFreeBond(e)) {
    const a = e.indexOf("(") + 1;
    const b = e.indexOf(",");

    const available = e.substring(a, b);
    archLogger.error(
      `\nNot enough free bond. Available: ${ethers.utils.formatEther(available)} SARCO`
    );
    return;
  }

  if (notEnoughReward(e)) {
    const a = e.indexOf("(") + 1;
    const b = e.indexOf(",");

    const available = e.substring(a, b);
    archLogger.error(
      `\nNot enough reward. Available: ${ethers.utils.formatEther(available)} SARCO`
    );
    return;
  }

  if (insufficientAllowance(e)) {
    archLogger.error(`\nTransaction reverted: Insufficient allowance`);
    archLogger.error(
      `Run \`npm run approve\` to grant Sarcophagus contracts permission to transfer your SARCO tokens.`
    );
    return;
  }

  if (lowSarcoBalance(e)) {
    archLogger.error(`\nInsufficient balance`);
    archLogger.error(`Add some SARCO to your account to continue`);
    return;
  }

  if (sarcoDoesNotExist(e)) {
    archLogger.error(`\nNo Sarcophagus found matching provided ID`);
    return;
  }

  if (badlyFormattedHash(e)) {
    archLogger.error(
      `\nInvalid data format. Please check to make sure your input is a valid keccak256 hash.`
    );
    return;
  }

  if (sarcoNotCleanable(e)) {
    archLogger.error(`\nThis Sarcophagus cannot be cleaned at this time`);
    return;
  }

  if (sarcoIsActuallyUnwrappable(e)) {
    archLogger.error(
      `\nThis Sarcophagus is ready to be unwrapped, so archaeologists cannot be accused of leaking`
    );
    return;
  }

  if (notEnoughProof(e)) {
    archLogger.error(
      `\nYou have not provided enough unencrypted shard hashes to fully raise an accusal`
    );
    return;
  }

  if (incorrectProof(e)) {
    archLogger.error(`\nOne or more of the proofs provided is incorrect`);
    return;
  }

  archLogger.error(`\n${e}`);
}
