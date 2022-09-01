import 'dotenv/config'
import { getWeb3Interface } from './web3-interface'
import { validateEnvVars } from '../utils/validateEnv'
import { exit } from 'process'
import { RPC_EXCEPTION } from '../utils/exit-codes'
import { archLogger } from '../utils/chalk-theme'
import { BigNumber, ethers } from 'ethers'
import { requestApproval } from './approve_utils'

validateEnvVars();

export interface ProfileArgs {
  diggingFee: BigNumber,
  rewrapInterval: number,
  freeBond: BigNumber
}

const web3Interface = await getWeb3Interface();


const handleException = (e) => {
  archLogger.error(e);
  exit(RPC_EXCEPTION);
}

export async function profileSetup(args: ProfileArgs, isUpdate: boolean) {
  const { diggingFee, rewrapInterval, freeBond } = args;
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

  const tx = isUpdate ?
    await web3Interface.archaeologistFacet.updateArchaeologist(diggingFee, rewrapInterval, freeBondDeposit) :
    await web3Interface.archaeologistFacet.registerArchaeologist(diggingFee, rewrapInterval, freeBondDeposit);

  archLogger.info("Waiting for transaction");
  setInterval(() => process.stdout.write("."), 1000);

  tx.wait().then(() => {
    archLogger.notice(isUpdate ? "PROFILE UPDATED!" : "\nPROFILE REGISTERED!");
    exit(0);
  }).catch(handleException);
}