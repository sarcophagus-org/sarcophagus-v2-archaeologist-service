import { ethers } from "ethers";
import { archLogger } from "../../logger/chalk-theme";
import { exit } from "process";
import { hasAllowance } from "../../scripts/approve_utils";
import { getWeb3Interface } from "../../scripts/web3-interface";
import { RPC_EXCEPTION } from "../../utils/exit-codes";
import { retryFn } from "./helpers";
import { handleRpcError } from "../../utils/rpc-error-handler";
import { SarcoSupportedNetwork } from "@sarcophagus-org/sarcophagus-v2-sdk";

/**
 * Approves Sarcophagus contracts' spending SARCO on the connected account's behalf up to `MaxUint256` tokens.
 */
export const runApprove = async (network?: SarcoSupportedNetwork) => {
  const web3Interface = await getWeb3Interface();
  const { sarcoToken, networkConfig } = web3Interface.getNetworkContext(network);

  archLogger.notice("Approving Sarcophagus contracts to spend SARCO on your behalf...");
  archLogger.info("Please wait for TX to confirm");

  if (await hasAllowance(ethers.constants.MaxUint256, network)) {
    return;
  }

  const interval = setInterval(() => process.stdout.write("."), 1000);

  const approveFn = () =>
    sarcoToken.approve(
      networkConfig.diamondDeployAddress,
      ethers.constants.MaxUint256
    );

  try {
    const tx = await retryFn(approveFn);
    await tx.wait();
    archLogger.notice("Approval succeeded!");
  } catch (error) {
    await handleRpcError(error);
    exit(RPC_EXCEPTION);
  } finally {
    clearInterval(interval);
  }
};
