import 'dotenv/config'
import { Web3Interface } from './web3-interface'
import { ethers } from 'ethers'
import { exit } from 'process'
import { RPC_EXCEPTION } from '../utils/exit-codes'
import { archLogger } from '../utils/chalk-theme'
import createpromt from 'prompt-sync';

const prompt = createpromt({ sigint: true });

const _hasAllowance = async (web3Interface: Web3Interface) => {
  const allowance = await web3Interface.sarcoToken.allowance(web3Interface.ethWallet.address, process.env.SARCO_DIAMOND_ADDRESS!);

  if (allowance.eq(ethers.constants.MaxUint256)) {
    archLogger.notice("Already approved");
    return true;
  }

  return false;
}

export const runApprove = async (web3Interface: Web3Interface) => {
  archLogger.notice("Approving Sarcophagus contracts to spend SARCO on your behalf...");

  if (await _hasAllowance(web3Interface)) {
    return;
  }

  setInterval(() => process.stdout.write("."), 1000);

  const handleException = (e) => {
    archLogger.error(e);
    exit(RPC_EXCEPTION);
  }

  const tx = await web3Interface.sarcoToken.approve(process.env.SARCO_DIAMOND_ADDRESS!, ethers.constants.MaxUint256).catch(handleException);

  archLogger.info("Waiting for transaction")
  tx.wait().then(() => {
    archLogger.notice("SUCCESS!");
  }).catch(handleException);

  return tx;
}

export const requestApproval = async (web3Interface: Web3Interface, reason: string): Promise<boolean> => {
  if (await _hasAllowance(web3Interface)) {
    return true;
  }

  archLogger.warn(reason);
  // @ts-ignore
  const response = prompt()

  if (response === "approve") {
    await runApprove(web3Interface);
    return true;
  } else {
    return false;
  }
}