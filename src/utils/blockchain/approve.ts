import { archLogger } from "../../logger/chalk-theme";
import { Web3Interface } from "../../scripts/web3-interface";
import { BigNumber } from "ethers";
import { RPC_EXCEPTION } from "../exit-codes";
import { exit } from "process";
import { retryFn } from "./helpers";

export const approve = async (web3Interface: Web3Interface, amt: BigNumber) => {
  archLogger.notice("approving sarcophagus contract to spend your SARCO");
  archLogger.info("Please wait for TX to confirm");
  const approveFn = (): Promise<any> => {
    return web3Interface.sarcoToken.approve(
      web3Interface.networkConfig.diamondDeployAddress,
      amt
    )
  }

  try {
    const tx = await retryFn(approveFn);
    await tx.wait();
    archLogger.notice("approval succeeded!");
  } catch (error) {
    archLogger.error(`Approval Failed: ${error.message}`)
    exit(RPC_EXCEPTION);
  }
}