import 'dotenv/config'
import { getWeb3Interface } from './web3-interface'
import { validateEnvVars } from '../utils/validateEnv'
import { exit } from 'process'
import { RPC_EXCEPTION } from '../utils/exit-codes'
import { archLogger } from '../utils/chalk-theme'
import { parseRegisterArgs } from 'utils/cli_parsers/parseRegisterArgs'

validateEnvVars();

const web3Interface = await getWeb3Interface();

archLogger.notice("Registering your Archaeologist profile...");

setInterval(() => process.stdout.write("."), 1000);

const handleException = (e) => {
  archLogger.error(e);
  exit(RPC_EXCEPTION);
}

const { minimumDiggingFee, maximumRewrapInterval, freeBond } = await parseRegisterArgs(web3Interface);

const tx = await web3Interface.archaeologistFacet.registerArchaeologist(minimumDiggingFee, maximumRewrapInterval, freeBond);

archLogger.info("Waiting for transaction");
tx.wait().then(() => {
  archLogger.notice("SUCCESS!");
  exit(0);
}).catch(handleException);