import { ethers } from "ethers";
import { archLogger } from "../../logger/chalk-theme";
import { exit } from "process";
import { hasAllowance } from "../../scripts/approve_utils";
import { Web3Interface } from "../../scripts/web3-interface";
import { RPC_EXCEPTION } from "../../utils/exit-codes";
import { retryFn } from "./helpers";

/**
 * Approves Sarcophagus contracts' spending SARCO on the connected account's behalf up to `MaxUint256` tokens.
 */
export const runApprove = async (web3Interface: Web3Interface) => {
  archLogger.notice("Approving Sarcophagus contracts to spend SARCO on your behalf...");
  archLogger.info("Please wait for TX to confirm");

  if (await hasAllowance(web3Interface, ethers.constants.MaxUint256)) {
    return;
  }

  const interval = setInterval(() => process.stdout.write("."), 1000);

  const approveFn = () =>
    web3Interface.sarcoToken.approve(
      web3Interface.networkConfig.diamondDeployAddress,
      ethers.constants.MaxUint256
    );

  try {
    const tx = await retryFn(approveFn);
    await tx.wait();
    archLogger.notice("Approval succeeded!");
  } catch (error) {
    archLogger.error(`Approval failed: ${error.message}`);
    exit(RPC_EXCEPTION);
  } finally {
    clearInterval(interval);
  }
};
