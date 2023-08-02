import { ethers } from "ethers";
import { archLogger } from "../logger/chalk-theme";
import { warnIfEthBalanceIsLow } from "./health-check";

const alreadyUnwrapped = (e: string) => e.includes("ArchaeologistAlreadyUnwrapped");
const notEnoughFreeBond = (e: string) => e.includes("NotEnoughFreeBond");
const notEnoughReward = (e: string) => e.includes("NotEnoughReward");
const insufficientAllowance = (e: string) => e.includes("insufficient allowance");
const profileShouldExistOrNot = (e: string) => e.includes("ArchaeologistProfileExistsShouldBe");
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
export async function handleRpcError(e: any) {
  const { reason, errorArgs, errorName } = e;

  const errorString: string = reason || errorName || "";

  if (alreadyUnwrapped(errorString)) {
    archLogger.error(`\nAlready unwrapped this Sarcophagus`, { logTimestamp: true });
    return;
  }

  if (profileShouldExistOrNot(errorString) && errorArgs.includes(true)) {
    // This error is handled in `getOnchainProfile`, which should be called first before calling
    // any contract functions that need a profile to exist. Only methods that fail to do this
    // will end up here.
    archLogger.error(`\nProfile not registered`, { logTimestamp: true });
    return;
  }

  if (profileShouldExistOrNot(errorString) && errorArgs.includes(false)) {
    archLogger.error(`\nProfile already exists`, { logTimestamp: true });
    return;
  }

  if (notEnoughFreeBond(errorString)) {
    const available = errorArgs[0];
    await archLogger.error(
      `\nNot enough free bond. Available: ${ethers.utils.formatEther(available)} SARCO`,
      { logTimestamp: true, sendNotification: true }
    );
    return;
  }

  if (notEnoughReward(errorString)) {
    const available = errorArgs[0];
    archLogger.error(
      `\nNot enough reward. Available: ${ethers.utils.formatEther(available)} SARCO`,
      { logTimestamp: true }
    );
    return;
  }

  if (insufficientAllowance(errorString)) {
    await archLogger.error(
      `\nInsufficient SARCO allowance. Run: \`cli approve -a\` to approve the contract to spend your SARCO`,
      { logTimestamp: true, sendNotification: true }
    );
    return;
  }

  if (lowSarcoBalance(errorString)) {
    archLogger.error(`\nInsufficient balance`, { logTimestamp: true });
    archLogger.error(`Add some SARCO to your account to continue`, { logTimestamp: true });
    return;
  }

  if (sarcoDoesNotExist(errorString)) {
    archLogger.error(`\nNo Sarcophagus found matching provided ID`, { logTimestamp: true });
    return;
  }

  if (badlyFormattedHash(errorString)) {
    archLogger.error(
      `\nInvalid data format. Please check to make sure your input is a valid keccak256 hash.`,
      { logTimestamp: true }
    );
    return;
  }

  if (sarcoNotCleanable(errorString)) {
    archLogger.error(`\nThis Sarcophagus cannot be cleaned at this time`, { logTimestamp: true });
    return;
  }

  if (sarcoIsActuallyUnwrappable(errorString)) {
    archLogger.error(
      `\nThis Sarcophagus is ready to be unwrapped, so archaeologists cannot be accused of leaking`,
      { logTimestamp: true }
    );
    return;
  }

  if (notEnoughProof(errorString)) {
    archLogger.error(
      `\nYou have not provided enough unencrypted shard hashes to fully raise an accusal`,
      { logTimestamp: true }
    );
    return;
  }

  if (incorrectProof(errorString)) {
    archLogger.error(`\nOne or more of the proofs provided is incorrect`, { logTimestamp: true });
    return;
  }

  await archLogger.error(`\n${e}`, { logTimestamp: true });
  await warnIfEthBalanceIsLow(true);
}
