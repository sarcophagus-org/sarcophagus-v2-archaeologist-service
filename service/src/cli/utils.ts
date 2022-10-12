import columnify from 'columnify';
import { OnchainProfile } from "../utils/onchain-data";
import { logCallout } from "../logger/formatter";
import { archLogger } from "../logger/chalk-theme";
import { formatEther } from "ethers/lib/utils";

export function dashToCamelCase(text: string): string {
  return text.replace(/-([a-z])/g, (v) => v[1].toUpperCase());
}

/**
 * Shallowly copies an object, converting keys from dash-case to camelCase.
 */
export function objectDashToCamelCase(input: any): any {
  const output: any = {};
  for (const key of Object.keys(input)) {
    output[dashToCamelCase(key)] = input[key];
  }
  return output;
}

export const logProfile = (profile: OnchainProfile) => {
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