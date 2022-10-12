import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import columnify from 'columnify';
import { validateEnvVars } from "../../utils/validateEnv";
import { getWeb3Interface } from "../../scripts/web3-interface";
import { getOnchainProfile, OnchainProfile } from "../../utils/onchain-data";
import { archLogger } from "../../logger/chalk-theme";
import { exit } from "process";
import { registerOptionDefinitions } from "./args-config";
import { usageConfig } from "./usage-config";
import { ProfileParams, profileSetup } from "../../scripts/profile-setup";
import { formatEther, parseEther } from "ethers/lib/utils";
import { logCallout } from "../../logger/formatter";
import { isBigNumber } from "hardhat/common";

const web3Interface = await getWeb3Interface();

/**
 * Shallowly copies an object, converting keys from dash-case to camelCase.
 */
export function dashToCamelCase(text: string): string {
  return text.replace(/-([a-z])/g, (v) => v[1].toUpperCase());
}

export function objectDashToCamelCase(input: any): any {
  const output: any = {};
  for (const key of Object.keys(input)) {
    output[dashToCamelCase(key)] = input[key];
  }
  return output;
}

const exitIfArchaeologistProfileExists = async () => {
  const profile = await getOnchainProfile(web3Interface);

  if (profile.exists) {
    archLogger.notice("Already registered!");
    exit(0);
  }
}

const logProfile = (profile: OnchainProfile) => {
  logCallout(() => {
    if (!profile.exists) {
      archLogger.warn('This archaeologist is not yet registered` \n');
    } else {
      console.log('ARCHAEOLOGIST PROFILE: \n');

      const formattedProfile = {};
      // Remove any entries where keys are numeric
      for (let [key, value] of Object.entries(profile)) {
        if (isNaN(Number(key))) {
          if (["minimumDiggingFee", "freeBond", "cursedBond"].includes(key)) {
            value = `${formatEther(value)} SARCO`
          }
          formattedProfile[key] = value;
        }
      }

      console.log(columnify(formattedProfile, {columns: ['FIELD', 'VALUE']}));
    }
  });
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
  const registerArgs = commandLineArgs(registerOptionDefinitions);

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