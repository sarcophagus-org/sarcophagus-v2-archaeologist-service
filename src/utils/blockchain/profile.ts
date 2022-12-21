import { BigNumber } from "ethers";
import { archLogger } from "../../logger/chalk-theme";
import { exit } from "process";
import { hasAllowance, requestApproval } from "../../scripts/approve_utils";
import { Web3Interface } from "../../scripts/web3-interface";
import { RPC_EXCEPTION } from "../../utils/exit-codes";
import { retryFn } from "./helpers";

export const depositFreeBond = async (web3Interface: Web3Interface, amt: BigNumber) => {
  archLogger.notice("Depositing free bond...");

  if (!(await hasAllowance(web3Interface, amt))) {
    await requestApproval(web3Interface);
  }

  setInterval(() => process.stdout.write("."), 1000);

  try {
    const tx = await retryFn(() => web3Interface.archaeologistFacet.depositFreeBond(amt));
    await tx.wait();
    archLogger.notice("Success!");
  } catch (error) {
    archLogger.error(`Deposit Failed: ${error.message}`);
    exit(RPC_EXCEPTION);
  }
};

export const withdrawFreeBond = async (web3Interface: Web3Interface, amt: BigNumber) => {
  archLogger.notice("Withdrawing free bond...");
  setInterval(() => process.stdout.write("."), 1000);

  try {
    const tx = await retryFn(() => web3Interface.archaeologistFacet.withdrawFreeBond(amt));
    await tx.wait();
    archLogger.notice("Success!");
  } catch (error) {
    archLogger.error(`Withdraw Failed: ${error.message}`);
    exit(RPC_EXCEPTION);
  }
};
