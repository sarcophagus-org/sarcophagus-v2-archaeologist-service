import { Command, CommandOptions } from "./command";
import { profileOptionDefinitions } from "../config/profile-args";
import { getOnchainProfile } from "../../utils/onchain-data";
import { logProfile, logValidationErrorAndExit } from "../utils";
import { validateEnvVars } from "../../utils/validateEnv";
import { ProfileOptionNames, ProfileCliParams, profileSetup } from "../../scripts/profile-setup";
import { archLogger } from "../../logger/chalk-theme";
import { Web3Interface } from "../../scripts/web3-interface";
import { exit } from "process";
import {
  isFreeBondProvidedAndZero,
  validateMaxResurrectionTime,
  validateRewrapInterval,
} from "../shared/profile-validations";
import { registerPrompt } from "../prompts/register-prompt";

export class Register implements Command {
  name = "register";
  aliases = ["r"];
  description =
    "Registers your archaeologist on-chain. You cannot accept curses without first being registered.";
  args = profileOptionDefinitions;

  async exitIfArchaeologistProfileExists() {
    const profile = await getOnchainProfile();

    if (profile.exists) {
      archLogger.notice("Already registered!");
      exit(0);
    }
  }

  async registerArchaeologist(registerArgs: ProfileCliParams) {
    validateEnvVars();
    await this.exitIfArchaeologistProfileExists();

    archLogger.notice("Registering your Archaeologist profile...");
    await profileSetup(registerArgs);
  }

  validateArgs(options: CommandOptions) {
    if (options.view || options.guided) {
      return;
    }

    const requiredOptions = [
      ProfileOptionNames.DIGGING_FEE,
      ProfileOptionNames.REWRAP_INTERVAL,
      ProfileOptionNames.CURSE_FEE,
    ];
    const providedOptions = Object.keys(options);
    const missingRequiredOptions = requiredOptions.filter(
      field => !providedOptions.includes(field)
    );

    if (missingRequiredOptions.length) {
      logValidationErrorAndExit(
        `The required options were not provided: ${missingRequiredOptions.toString()}`
      );
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
      const profile = await getOnchainProfile();
      logProfile(profile);
    } else if (options.guided) {
      // Begin guided flow for registering archaeologist
      await registerPrompt();
    } else {
      await this.registerArchaeologist(options as ProfileCliParams);
    }
  }
}
