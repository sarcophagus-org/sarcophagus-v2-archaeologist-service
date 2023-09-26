import { BigNumber } from "ethers";
import { archLogger } from "../../logger/chalk-theme";
import { exit } from "process";
import { hasAllowance, requestApproval } from "../../scripts/approve_utils";
import { RPC_EXCEPTION } from "../../utils/exit-codes";
import { retryFn } from "./helpers";
import { handleRpcError } from "../../utils/rpc-error-handler";
import { NetworkContext } from "network-config";

export const depositFreeBond = async (amt: BigNumber, networkContext: NetworkContext) => {
  const { archaeologistFacet } = networkContext;

  archLogger.notice("Depositing free bond...");

  if (!(await hasAllowance(amt, networkContext))) {
    await requestApproval(networkContext);
  }

  setInterval(() => process.stdout.write("."), 1000);

  try {
    const tx = await retryFn(() => archaeologistFacet.depositFreeBond(amt));
    await tx.wait();
    archLogger.notice("Success!");
  } catch (error) {
    await handleRpcError(error, networkContext);
    exit(RPC_EXCEPTION);
  }
};

export const withdrawFreeBond = async (amt: BigNumber, networkContext: NetworkContext) => {
  const { archaeologistFacet } = networkContext;

  archLogger.notice("Withdrawing free bond...");
  setInterval(() => process.stdout.write("."), 1000);

  try {
    const tx = await retryFn(() => archaeologistFacet.withdrawFreeBond(amt));
    await tx.wait();
    archLogger.notice("Success!");
  } catch (error) {
    await handleRpcError(error, networkContext);
    exit(RPC_EXCEPTION);
  }
};

export const withdrawRewards = async (networkContext: NetworkContext) => {
  const { archaeologistFacet } = networkContext;

  archLogger.notice("Withdrawing your rewards...");
  setInterval(() => process.stdout.write("."), 1000);

  try {
    const tx = await retryFn(() => archaeologistFacet.withdrawReward());
    await tx.wait();
    archLogger.notice("Success!");
  } catch (error) {
    await handleRpcError(error, networkContext);
    exit(RPC_EXCEPTION);
  }
};
