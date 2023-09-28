import { Command, CommandOptions } from "./command";
import { profileOptionDefinitions } from "../config/profile-args";
import { getOnchainProfile } from "../../utils/onchain-data";
import { logValidationErrorAndExit } from "../utils";
import { validateEnvVars } from "../../utils/validateEnv";
import { ProfileOptionNames, ProfileCliParams, profileSetup } from "../../scripts/profile-setup";
import { archLogger } from "../../logger/chalk-theme";
import { exit } from "process";
import {
  isFreeBondProvidedAndZero,
  validateMaxResurrectionTime,
  validateRewrapInterval,
} from "../shared/profile-validations";
import { registerPrompt } from "../prompts/register-prompt";
import { NetworkContext } from "../../network-config";
import { getWeb3Interface } from "../../scripts/web3-interface";

export class Register implements Command {
  name = "register";
  aliases = ["r"];
  description =
    "Registers your archaeologist on-chain. You cannot accept curses without first being registered.";
  args = profileOptionDefinitions.filter(obj => obj.alias !== "u");
  networkContext: NetworkContext

  async exitIfArchaeologistProfileExists() {
    const profile = await getOnchainProfile(this.networkContext);

    if (profile.exists) {
      archLogger.notice("Already registered!");
      exit(0);
    }
  }

  async registerArchaeologist(registerArgs: ProfileCliParams) {
    validateEnvVars();
    await this.exitIfArchaeologistProfileExists();

    archLogger.notice("Registering your Archaeologist profile...");
    await profileSetup(registerArgs, this.networkContext);
  }

  validateArgs(options: CommandOptions) {
    const multipleChains = process.env.CHAIN_IDS!.split(",").length > 1;
    if (multipleChains && !options.network) {
      logValidationErrorAndExit("Missing network option. Use --network to specify a network to run this command on.");
    }

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
    this.networkContext = (await getWeb3Interface()).getNetworkContext(options.network);

    if (options.guided) {
      // Begin guided flow for registering archaeologist
      await registerPrompt(this.networkContext);
    } else {
      await this.registerArchaeologist(options as ProfileCliParams);
    }
  }
}
