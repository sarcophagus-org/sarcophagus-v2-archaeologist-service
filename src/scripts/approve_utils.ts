import "dotenv/config";
import { Web3Interface } from "./web3-interface";
import { BigNumber, ethers } from "ethers";
import { exit } from "process";
import { RPC_EXCEPTION } from "../utils/exit-codes";
import { archLogger } from "../logger/chalk-theme";
import createPrompt from "prompt-sync";

const prompt = createPrompt({ sigint: true });

const _hasAllowance = async (web3Interface: Web3Interface, amt: BigNumber) => {
  const allowance = await web3Interface.sarcoToken.allowance(
    web3Interface.ethWallet.address,
    process.env.SARCO_DIAMOND_ADDRESS!
  );

  if (allowance.gte(amt)) {
    archLogger.notice("Already approved");
    return true;
  }

  return false;
};

/**
 * Approves Sarcophagus contracts' spending SARCO on the connected account's behalf up to `MaxUint256` tokens.
 *
 * `runApprove` is really only used by the approve script - which IS attempting to approve `MaxUint256` tokens -
 * or by `requestApproval` when there's either not enough allowance or the previous `MaxUint256` allowance has
 * somehow dropped so low that the pending transfer exceeds that allowance. So checking for allowance on `MaxUint256`
 * is exactly what is wanted.
 */
export const runApprove = async (web3Interface: Web3Interface) => {
  archLogger.notice("Approving Sarcophagus contracts to spend SARCO on your behalf...");

  if (await _hasAllowance(web3Interface, ethers.constants.MaxUint256)) {
    return;
  }

  setInterval(() => process.stdout.write("."), 1000);

  const handleException = e => {
    archLogger.error(e);
    exit(RPC_EXCEPTION);
  };

  const tx = await web3Interface.sarcoToken
    .approve(process.env.SARCO_DIAMOND_ADDRESS!, ethers.constants.MaxUint256)
    .catch(handleException);

  archLogger.info("Waiting for transaction");
  tx.wait()
    .then(() => {
      archLogger.notice("SUCCESS!");
    })
    .catch(handleException);

  return tx;
};

export const requestApproval = async (
  web3Interface: Web3Interface,
  reason: string,
  sarcoToTransfer: BigNumber
): Promise<boolean> => {
  if (await _hasAllowance(web3Interface, sarcoToTransfer)) {
    return true;
  }

  archLogger.warn(reason);
  // @ts-ignore
  const response = prompt();

  if (response === "approve") {
    await runApprove(web3Interface);
    return true;
  } else {
    return false;
  }
};
