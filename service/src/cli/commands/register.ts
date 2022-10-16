import { Command, CommandOptions } from "./command";
import { profileOptionDefinitions } from "../config/profile-args";
import { getOnchainProfile } from "../../utils/onchain-data";
import { logProfile, logValidationErrorAndExit } from "../utils";
import { validateEnvVars } from "../../utils/validateEnv";
import { ProfileOptionNames, ProfileParams, profileSetup } from "../../scripts/profile-setup";
import { archLogger } from "../../logger/chalk-theme";
import { Web3Interface } from "../../scripts/web3-interface";
import { exit } from "process";
import { isFreeBondProvidedAndZero, validateRewrapInterval } from "../shared/profile-validations";

export class Register implements Command {
  name = "register";
  aliases = ["r"];
  description =
    "Registers your archaeologist on-chain. You cannot accept curses without first being registered.";
  args = profileOptionDefinitions;
  web3Interface: Web3Interface;

  constructor(web3Interface: Web3Interface) {
    this.web3Interface = web3Interface;
  }

  async exitIfArchaeologistProfileExists() {
    const profile = await getOnchainProfile(this.web3Interface);

    if (profile.exists) {
      archLogger.notice("Already registered!");
      exit(0);
    }
  }

  async registerArchaeologist(registerArgs: ProfileParams) {
    validateEnvVars();
    await this.exitIfArchaeologistProfileExists();

    archLogger.notice("Registering your Archaeologist profile...");
    await profileSetup(registerArgs);
  }

  validateArgs(options: CommandOptions) {
    if (options.view) {
      return;
    }

    const requiredOptions = [ProfileOptionNames.DIGGING_FEE, ProfileOptionNames.REWRAP_INTERVAL];
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

    if (isFreeBondProvidedAndZero(options.freeBond)) {
      delete options.freeBond;
    }
  }

  async run(options: CommandOptions): Promise<void> {
    if (options.view) {
      // output profile
      const profile = await getOnchainProfile(this.web3Interface);
      logProfile(profile);
    } else {
      await this.registerArchaeologist(options as ProfileParams);
    }
  }
}
