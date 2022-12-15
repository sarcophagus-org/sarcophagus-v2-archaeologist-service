import "dotenv/config";
import { getWeb3Interface } from "../web3-interface";
import { validateEnvVars } from "../../utils/validateEnv";
import { archLogger } from "../../logger/chalk-theme";
import { parseAccuseArgs } from "../../utils/cli_parsers/parseAccuseArgs";
import { handleRpcError } from "../../utils/rpc-error-handler";
import { RPC_EXCEPTION } from "../../utils/exit-codes";
import { exit } from "process";

// TODO -- update accuse to work with CLI and new private key setup
validateEnvVars();

const web3Interface = await getWeb3Interface();

archLogger.notice("Accusing Archaeologists");

setInterval(() => process.stdout.write("."), 1000);

const { sarcoId, paymentAddress, keyShareHashes } = await parseAccuseArgs();

try {
  const tx = await web3Interface.thirdPartyFacet.accuse(sarcoId, keyShareHashes, paymentAddress);

  archLogger.info("Waiting for transaction");
  await tx.wait();

  archLogger.notice("SUCCESS!");
  exit(0);
} catch (e) {
  handleRpcError(e.reason ? e.reason : e);
  exit(RPC_EXCEPTION);
}
