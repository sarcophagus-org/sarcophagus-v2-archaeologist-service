import 'dotenv/config'
import { getWeb3Interface } from './web3-interface'
import { validateEnvVars } from '../utils/validateEnv'
import { exit } from 'process'
import { RPC_EXCEPTION } from '../utils/exit-codes'
import { archLogger } from '../utils/chalk-theme'
import { parseUpdateArgs } from '../utils/cli_parsers/parseUpdateArgs'
import { ethers } from 'ethers'
import { requestApproval } from './approve'

validateEnvVars();

const web3Interface = await getWeb3Interface();

archLogger.notice("Updating your Archaeologist profile...");

const handleException = (e) => {
  archLogger.error(e);
  exit(RPC_EXCEPTION);
}

const { minimumDiggingFee, maximumRewrapInterval, freeBond } = await parseUpdateArgs(web3Interface);

let freeBondDeposit = ethers.constants.Zero;

if (freeBond.gt(ethers.constants.Zero)) {
  const approved = await requestApproval(
    "You will need to approve Sarcophagus contracts to use your SARCO in order to deposit free bond.\nEnter 'approve' to authorize this, or else hit <ENTER> to continue without a deposit:"
  )

  if (approved) {
    freeBondDeposit = freeBond;
  } else {
    archLogger.info("Skipping free bond depoist");
  }
}

const tx = await web3Interface.archaeologistFacet.updateArchaeologist(minimumDiggingFee, maximumRewrapInterval, freeBondDeposit);

archLogger.info("Waiting for transaction");
setInterval(() => process.stdout.write("."), 1000);

tx.wait().then(() => {
  archLogger.notice("PROFILE UPDATED!");
  exit(0);
}).catch(handleException);