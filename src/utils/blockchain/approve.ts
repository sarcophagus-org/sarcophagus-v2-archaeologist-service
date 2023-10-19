import { ethers } from "ethers";
import { archLogger } from "../../logger/chalk-theme";
import { exit } from "process";
import { hasAllowance } from "../../scripts/approve_utils";
import { RPC_EXCEPTION } from "../../utils/exit-codes";
import { retryFn } from "./helpers";
import { handleRpcError } from "../../utils/rpc-error-handler";
import { NetworkContext } from "../../network-config";

/**
 * Approves Sarcophagus contracts' spending SARCO on the connected account's behalf up to `MaxUint256` tokens.
 */
export const runApprove = async (networkContext: NetworkContext) => {
  const { sarcoToken, networkConfig } = networkContext;

  archLogger.notice(
    `Approving Sarcophagus contracts to spend ${networkContext.networkName.toUpperCase()} SARCO on your behalf...`
  );
  archLogger.info("Please wait for TX to confirm");

  if (await hasAllowance(ethers.constants.MaxUint256, networkContext)) {
    return;
  }

  const interval = setInterval(() => process.stdout.write("."), 1000);

  const gasPrice = await networkContext.ethWallet.getGasPrice();
  const gasMultiplier = ethers.BigNumber.from(process.env.GAS_MULTIPLIER || "1")
  const txOverrides = {
    gasPrice: gasPrice.mul(gasMultiplier)
  }
  const approveFn = () =>
    sarcoToken.approve(networkConfig.diamondDeployAddress, ethers.constants.MaxUint256, txOverrides);

  try {
    const tx = await retryFn(approveFn);
    await tx.wait();
    archLogger.notice("Approval succeeded!");
  } catch (error) {
    await handleRpcError(error, networkContext);
    exit(RPC_EXCEPTION);
  } finally {
    clearInterval(interval);
  }
};
