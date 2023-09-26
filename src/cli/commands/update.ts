import { Command, CommandOptions } from "./command";
import { profileOptionDefinitions } from "../config/profile-args";
import { getOnchainProfile, OnchainProfile } from "../../utils/onchain-data";
import {
  logNotRegistered,
  logProfile,
  logValidationErrorAndExit,
  ONE_MONTH_IN_SECONDS,
} from "../utils";
import { validateEnvVars } from "../../utils/validateEnv";
import { ProfileCliParams, profileSetup } from "../../scripts/profile-setup";
import { archLogger } from "../../logger/chalk-theme";
import { exit } from "process";
import {
  isFreeBondProvidedAndZero,
  validateMaxResurrectionTime,
  validateRewrapInterval,
} from "../shared/profile-validations";
import { NO_ONCHAIN_PROFILE, SUCCESS } from "../../utils/exit-codes";

export class Update implements Command {
  name = "update";
  aliases = ["u"];
  description = "Updates your archaeologist profile on-chain.";
  args = profileOptionDefinitions;
  profile: OnchainProfile | undefined;

  async setProfileOrExit() {
    const profile = await getOnchainProfile();

    if (!profile.exists) {
      logNotRegistered();
      exit(NO_ONCHAIN_PROFILE);
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

    if (!updateArgs.curseFee) {
      updateArgs.curseFee = this.profile!.curseFee;
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
    const multipleChains = process.env.CHAIN_IDS!.split(",").length > 1;
    if (multipleChains && !options.network) {
      archLogger.warn(
        "Missing network option. Use --network to specify a network to run this command on."
      );
      return;
    }

    if (options.view) {
      // output profile
      const profile = await getOnchainProfile();
      logProfile(profile);
    } else if (options.domain) {
      await this.updateArchaeologist({});
    } else {
      await this.updateArchaeologist(options as ProfileCliParams);
    }

    exit(SUCCESS);
  }
}
