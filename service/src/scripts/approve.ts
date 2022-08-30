import 'dotenv/config'
import { getWeb3Interface } from './web3-interface'
import { validateEnvVars } from '../utils/validateEnv'
import { runApprove } from './approve_utils'
import { exit } from 'process';

validateEnvVars();

const web3Interface = await getWeb3Interface();

runApprove(web3Interface).then(tx => tx?.wait().then(_ => exit(0)));