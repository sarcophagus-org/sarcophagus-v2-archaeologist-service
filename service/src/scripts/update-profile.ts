import "dotenv/config";
import { getWeb3Interface } from "./web3-interface";
import { validateEnvVars } from "../utils/validateEnv";
import { archLogger } from "../logger/chalk-theme";
import { parseUpdateArgs } from "../utils/cli_parsers/parseUpdateArgs";
import { profileSetup } from "./profile-setup";

validateEnvVars();

const web3Interface = await getWeb3Interface();

archLogger.notice("Updating your Archaeologist profile...");

const profileParams = await parseUpdateArgs(web3Interface);

await profileSetup(profileParams, true);
