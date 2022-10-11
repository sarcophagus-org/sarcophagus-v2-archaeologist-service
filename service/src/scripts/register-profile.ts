import "dotenv/config";
import { getWeb3Interface } from "./web3-interface";
import { validateEnvVars } from "../utils/validateEnv";
import { exit } from "process";
import { archLogger } from "../logger/chalk-theme";
import { parseRegisterArgs } from "../utils/cli_parsers/parseRegisterArgs";
import { getOnchainProfile } from "../utils/onchain-data";
import { profileSetup } from "./profile-setup";

validateEnvVars();

const web3Interface = await getWeb3Interface();
const profile = await getOnchainProfile(web3Interface);

archLogger.notice("Registering your Archaeologist profile...");

if (profile.exists) {
  archLogger.notice("Already registered!");
  exit(0);
}

const profileParams = await parseRegisterArgs();

await profileSetup(profileParams, false);
