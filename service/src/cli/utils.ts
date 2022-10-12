import columnify from 'columnify';
import commandLineArgs from 'command-line-args';
import { OnchainProfile } from "../utils/onchain-data";
import { logCallout } from "../logger/formatter";
import { archLogger } from "../logger/chalk-theme";
import { formatEther } from "ethers/lib/utils";
import { exit } from "process";

export const handleProfileArgs = (optionDefinitions: any): any => {
  let args;
  try {
    args = commandLineArgs(optionDefinitions);
    return args;
  } catch (err) {

    logCallout(() => {
      const errorName = () => {
        switch (err.name) {
          case 'UNKNOWN_OPTION':
            return `You used an invalid option: ${err.optionName}`
          case 'UNKNOWN_VALUE':
            return `You used an invalid value for one of the options: ${err.value}`;
          case 'ALREADY_SET':
            return `A value for option ${err.optionName} was already set.}`
        }
      }

      archLogger.error(errorName());
      archLogger.warn("\nPlease use --help to see list of valid options.");
    })
    exit(1);
  }
}

export const logProfile = (profile: OnchainProfile): void => {
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

/**
 * Shallowly copies an object, converting keys from dash-case to camelCase.
 */
export const objectDashToCamelCase = (input: any): any => {
  const output: any = {};
  for (const key of Object.keys(input)) {
    output[dashToCamelCase(key)] = input[key];
  }
  return output;
}

export const dashToCamelCase = (text: string): string => {
  return text.replace(/-([a-z])/g, (v) => v[1].toUpperCase());
}
