import { Command, CommandOptions } from "./command";
import { profileOptionDefinitions } from "../config/profile-args";
import { getOnchainProfile, OnchainProfile } from "../../utils/onchain-data";
import { logProfile, logValidationErrorAndExit, ONE_MONTH_IN_SECONDS } from "../utils";
import { validateEnvVars } from "../../utils/validateEnv";
import { ProfileCliParams, profileSetup } from "../../scripts/profile-setup";
import { archLogger } from "../../logger/chalk-theme";
import { Web3Interface } from "../../scripts/web3-interface";
import { exit } from "process";
import {
  isFreeBondProvidedAndZero,
  validateMaxResurrectionTime,
  validateRewrapInterval,
} from "../shared/profile-validations";

export class Update implements Command {
  name = "update";
  aliases = ["u"];
  description = "Updates your archaeologist profile on-chain.";
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

  async updateArchaeologist(updateArgs: ProfileCliParams) {
    validateEnvVars();
    await this.setProfileOrExit();

    archLogger.notice("Updating your Archaeologist profile...");

    // If update arg doesn't exist on args provided, use existing profile value
    if (!updateArgs.diggingFee) {
      updateArgs.diggingFee = this.profile!.minimumDiggingFeePerSecond.mul(ONE_MONTH_IN_SECONDS);
    }

    if (!updateArgs.rewrapInterval) {
      updateArgs.rewrapInterval = Number(this.profile!.maximumRewrapInterval);
    }

    if (!updateArgs.maxResTime) {
      updateArgs.maxResTime = Number(this.profile!.maximumResurrectionTime);
    }

    await profileSetup(updateArgs, true);
  }

  validateArgs(options: CommandOptions) {
    if (options.view) {
      return;
    }

    if (!Object.keys(options).length) {
      logValidationErrorAndExit(`Update must have at least one option provided`);
    }

    validateRewrapInterval(options.rewrapInterval);
    validateMaxResurrectionTime(options.maxResTime);

    if (isFreeBondProvidedAndZero(options.freeBond)) {
      delete options.freeBond;
    }
  }

  async run(options: CommandOptions): Promise<void> {
    if (options.view) {
      // output profile
      const profile = await getOnchainProfile(this.web3Interface);
      logProfile(profile);
    } else if (options.domain) {
      await this.updateArchaeologist({});
    } else {
      await this.updateArchaeologist(options as ProfileCliParams);
    }
  }
}
