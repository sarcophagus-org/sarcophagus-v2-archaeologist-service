import 'dotenv/config'
import { getWeb3Interface } from './web3-interface'
import { validateEnvVars } from '../utils/validateEnv'
import { archLogger } from '../utils/chalk-theme'
import { parseUpdateArgs } from '../utils/cli_parsers/parseUpdateArgs'
import { profileSetup } from './profile-setup'

validateEnvVars();

const web3Interface = await getWeb3Interface();

archLogger.notice("Updating your Archaeologist profile...");

const { minimumDiggingFee, maximumRewrapInterval, freeBond } = await parseUpdateArgs(web3Interface);

await profileSetup({ diggingFee: minimumDiggingFee, rewrapInterval: maximumRewrapInterval, freeBond }, true);