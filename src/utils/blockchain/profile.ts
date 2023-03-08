import { BigNumber } from "ethers";
import { archLogger } from "../../logger/chalk-theme";
import { exit } from "process";
import { hasAllowance, requestApproval } from "../../scripts/approve_utils";
import { getWeb3Interface, Web3Interface } from "../../scripts/web3-interface";
import { RPC_EXCEPTION } from "../../utils/exit-codes";
import { retryFn } from "./helpers";
import { handleRpcError } from "../../utils/rpc-error-handler";

export const depositFreeBond = async (amt: BigNumber) => {
  const web3Interface = await getWeb3Interface();

  archLogger.notice("Depositing free bond...");

  if (!(await hasAllowance(amt))) {
    await requestApproval();
  }

  setInterval(() => process.stdout.write("."), 1000);

  try {
    const tx = await retryFn(async () => {
      await web3Interface.archaeologistFacet.depositFreeBond(amt);
    });
    await tx.wait();
    archLogger.notice("Success!");
  } catch (error) {
    handleRpcError(error);
    exit(RPC_EXCEPTION);
  }
};

export const withdrawFreeBond = async (amt: BigNumber) => {
  const web3Interface = await getWeb3Interface();

  archLogger.notice("Withdrawing free bond...");
  setInterval(() => process.stdout.write("."), 1000);

  try {
    const tx = await retryFn(async () => await web3Interface.archaeologistFacet.withdrawFreeBond(amt));
    await tx.wait();
    archLogger.notice("Success!");
  } catch (error) {
    handleRpcError(error);
    exit(RPC_EXCEPTION);
  }
};

export const withdrawRewards = async () => {
  const web3Interface = await getWeb3Interface();
  archLogger.notice("Withdrawing your rewards...");
  setInterval(() => process.stdout.write("."), 1000);

  try {
    const tx = await retryFn(async () => await web3Interface.archaeologistFacet.withdrawReward());
    await tx.wait();
    archLogger.notice("Success!");
  } catch (error) {
    handleRpcError(error);
    exit(RPC_EXCEPTION);
  }
};
