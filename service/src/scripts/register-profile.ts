import 'dotenv/config'
import { getWeb3Interface } from './web3-interface'
import { validateEnvVars } from '../utils/validateEnv'
import { exit } from 'process'
import { RPC_EXCEPTION } from '../utils/exit-codes'
import { archLogger } from '../utils/chalk-theme'
import { parseRegisterArgs } from '../utils/cli_parsers/parseRegisterArgs'
import { getOnchainProfile } from '../utils/onchain-data'
import { ethers } from 'ethers'
import { requestApproval } from './approve_utils'

validateEnvVars();

const web3Interface = await getWeb3Interface();
const profile = await getOnchainProfile(web3Interface);

archLogger.notice("Registering your Archaeologist profile...");

if (profile.exists) {
  archLogger.notice("Already registered!");
  exit(0);
}


const handleException = (e) => {
  archLogger.error(e);
  exit(RPC_EXCEPTION);
}

const { minimumDiggingFee, maximumRewrapInterval, freeBond } = await parseRegisterArgs(web3Interface);

let freeBondDeposit = ethers.constants.Zero;

if (freeBond.gt(ethers.constants.Zero)) {
  const approved = await requestApproval(
    web3Interface,
    "You will need to approve Sarcophagus contracts to use your SARCO in order to deposit free bond.\nEnter 'approve' to authorize this, or else hit <ENTER> to continue without a deposit:",
    freeBond,
  )

  if (approved) {
    freeBondDeposit = freeBond;
  } else {
    archLogger.info("Skipping free bond deposit");
  }
}

const tx = await web3Interface.archaeologistFacet.registerArchaeologist(minimumDiggingFee, maximumRewrapInterval, freeBondDeposit);

archLogger.info("Waiting for transaction");
setInterval(() => process.stdout.write("."), 1000);

tx.wait().then(() => {
  archLogger.notice("\nPROFILE REGISTERED!");
  exit(0);
}).catch(handleException);