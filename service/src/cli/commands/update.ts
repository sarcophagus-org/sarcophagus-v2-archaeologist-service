import {Command, CommandOptions} from './command';
import { profileOptionDefinitions } from "../config/options-config";
import { getOnchainProfile, OnchainProfile } from "../../utils/onchain-data";
import { logProfile, logValidationErrorAndExit } from "../utils";
import { validateEnvVars } from "../../utils/validateEnv";
import { ProfileOptionNames, ProfileParams, profileSetup } from "../../scripts/profile-setup";
import { archLogger } from "../../logger/chalk-theme";
import { Web3Interface } from "../../scripts/web3-interface";
import { exit } from "process";
import { isFreeBondProvidedAndZero, validateRewrapInterval } from "../shared/profile-validations";

export class Update implements Command {
  name = 'update';
  aliases = ['u'];
  description = 'Updates your archaeologist profile on-chain.';
  args = profileOptionDefinitions;
  web3Interface: Web3Interface;
  profile: OnchainProfile | undefined;

  constructor(web3Interface: Web3Interface) {
    this.web3Interface = web3Interface;
  }

  async setProfileOrExit() {
    const profile = await getOnchainProfile(this.web3Interface);

    if (!profile.exists) {
      archLogger.notice("Archaeologist is not registered yet!");
      exit(0);
    }

    this.profile = profile;
  }

  async updateArchaeologist(updateArgs: ProfileParams) {
    validateEnvVars();
    await this.setProfileOrExit();

    archLogger.notice("Updating your Archaeologist profile...");

    // If update arg doesn't exist on args provided, use existing profile value
    if (!updateArgs.diggingFee) {
      updateArgs.diggingFee = this.profile!.minimumDiggingFee;
    }

    if (!updateArgs.rewrapInterval) {
      updateArgs.rewrapInterval = Number(this.profile!.maximumRewrapInterval);
    }

    await profileSetup(updateArgs, true);
  }

  validateArgs(options: CommandOptions) {
    if (options.view) { return }

    if (!Object.keys(options).length) {
      logValidationErrorAndExit(
        `Update must have at least one option provided`
      )
    }

    validateRewrapInterval(options.rewrapInterval)

    if(isFreeBondProvidedAndZero(options.freeBond)) {
      delete options.freeBond;
    }
  }

  async run(options: CommandOptions): Promise<void> {
    if (options.view) {
      // output profile
      const profile = await getOnchainProfile(this.web3Interface);
      logProfile(profile);
    } else {
      await this.updateArchaeologist(options as ProfileParams);
    }
  }
}