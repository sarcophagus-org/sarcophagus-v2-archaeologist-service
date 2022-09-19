import 'dotenv/config'
import { getWeb3Interface } from '../web3-interface'
import { validateEnvVars } from '../../utils/validateEnv'
import { archLogger } from '../../utils/chalk-theme';
import { parseCleanSarcoArgs } from '../../utils/cli_parsers/parseCleanSarcoArgs';
import { handleRpcError } from '../../utils/rpc-error-handler';
import { RPC_EXCEPTION } from '../../utils/exit-codes';
import { exit } from 'process';

validateEnvVars();

const web3Interface = await getWeb3Interface();

archLogger.notice("Cleaning Sarcophagus");

setInterval(() => process.stdout.write("."), 1000);

const { sarcoId, paymentAddress } = await parseCleanSarcoArgs();

try {
    const tx = await web3Interface.thirdPartyFacet.clean(sarcoId, paymentAddress);

    archLogger.info("Waiting for transaction")
    await tx.wait()

    archLogger.notice("SUCCESS!");
    exit(0);
} catch (e) {
    handleRpcError(e.reason ? e.reason : e);
    exit(RPC_EXCEPTION);
}