import 'dotenv/config'
import { getWeb3Interface } from './web3-interface'
import { validateEnvVars } from '../utils/validateEnv'
import { ethers } from 'ethers'
import { exit } from 'process'
import { RPC_EXCEPTION } from '../utils/exit-codes'
import { archLogger } from '../utils/chalk-theme'
import createpromt from 'prompt-sync';

const prompt = createpromt({ sigint: true });

validateEnvVars();

const web3Interface = await getWeb3Interface();

export const runApprove = async () => {
  archLogger.notice("Approving Sarcophagus contracts to spend SARCO on your behalf...");

  setInterval(() => process.stdout.write("."), 1000);

  const handleException = (e) => {
    archLogger.error(e);
    exit(RPC_EXCEPTION);
  }

  const tx = await web3Interface.sarcoToken.approve(process.env.SARCO_DIAMOND_ADDRESS!, ethers.constants.MaxUint256).catch(handleException);

  archLogger.info("Waiting for transaction")
  tx.wait().then(() => {
    archLogger.notice("SUCCESS!");
    exit(0);
  }).catch(handleException);
}

export const requestApproval = async (reason: string): Promise<boolean> => {
  archLogger.warn(reason);
  // @ts-ignore
  const response = prompt()

  if (response === "approve") {
    archLogger.notice("Approving Sarcophagus contracts to spend SARCO on your behalf...");
    await runApprove();
    return true;
  } else {
    return false;
  }
}

runApprove();