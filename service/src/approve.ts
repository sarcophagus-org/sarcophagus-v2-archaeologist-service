import 'dotenv/config'
import { getWeb3Interface } from './scripts/web3-interface'
import { validateEnvVars } from './utils/validateEnv'
import { ethers } from 'ethers'
import { exit } from 'process'
import { RPC_EXCEPTION } from './utils/exit-codes'

validateEnvVars();

const web3Interface = await getWeb3Interface();

console.log("Approving Sarcophagus contracts to spend SARCO on your behalf...");

setInterval(() => process.stdout.write("."), 1000);

const handleException = (e) => {
  console.error('someht');
  console.error(e);
  exit(RPC_EXCEPTION);
}

const tx = await web3Interface.sarcoToken.approve(process.env.SARCO_DIAMOND_ADDRESS!, ethers.constants.MaxUint256).catch(handleException);

console.log("Waiting for transaction")
tx.wait().then(() => {
  console.log("SUCCESS!");
  exit(0);
}).catch(handleException);