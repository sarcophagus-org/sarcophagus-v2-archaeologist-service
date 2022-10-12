import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import { validateEnvVars } from "../../utils/validateEnv";
import { getWeb3Interface } from "../../scripts/web3-interface";
import { getOnchainProfile } from "../../utils/onchain-data";
import { archLogger } from "../../logger/chalk-theme";
import { exit } from "process";
import { registerOptionDefinitions } from "./args-config";
import { usageConfig } from "./usage-config";
import { ProfileParams, profileSetup } from "../../scripts/profile-setup";
import { parseEther } from "ethers/lib/utils";
import { handleProfileArgs, logProfile, objectDashToCamelCase } from "../utils";

const web3Interface = await getWeb3Interface();

const exitIfArchaeologistProfileExists = async () => {
  const profile = await getOnchainProfile(web3Interface);

  if (profile.exists) {
    archLogger.notice("Already registered!");
    exit(0);
  }
}

const registerArchaeologist = async (registerArgs: any) => {
  validateEnvVars();
  await exitIfArchaeologistProfileExists();

  const formattedArgs = objectDashToCamelCase(registerArgs);
  const finalRegisterArgs: ProfileParams = {
    diggingFee: parseEther(formattedArgs.diggingFee),
    rewrapInterval: Number(formattedArgs.rewrapInterval),
    freeBond: parseEther(formattedArgs.freeBond)
  }

  archLogger.notice("Registering your Archaeologist profile...");
  await profileSetup(finalRegisterArgs);
}

const run = async () => {
  const registerArgs = handleProfileArgs(registerOptionDefinitions);

  if (registerArgs.help) {
    // output help guide
    console.log(commandLineUsage(usageConfig))
  } else if (registerArgs.view) {
    // output profile
    const profile = await getOnchainProfile(web3Interface);
    logProfile(profile);
  } else {
    await registerArchaeologist(registerArgs);
  }
}

await run();