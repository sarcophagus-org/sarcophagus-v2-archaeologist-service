import {Command, CommandOptions} from './command';
import { profileOptionDefinitions } from "../config/options-config";
import { getOnchainProfile } from "../../utils/onchain-data";
import { logProfile } from "../utils";
import { validateEnvVars } from "../../utils/validateEnv";
import { ProfileParams, profileSetup } from "../../scripts/profile-setup";
import { parseEther } from "ethers/lib/utils";
import { archLogger } from "../../logger/chalk-theme";
import { Web3Interface } from "../../scripts/web3-interface";
import { exit } from "process";

export class Register implements Command {
  name = 'register';
  aliases = ['r'];
  description = 'Registers your archaeologist on-chain. You cannot accept curses without first being registered.';
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

  async registerArchaeologist(registerArgs: any) {
    validateEnvVars();
    await this.exitIfArchaeologistProfileExists();

    const finalRegisterArgs: ProfileParams = {
      diggingFee: parseEther(registerArgs.diggingFee),
      rewrapInterval: Number(registerArgs.rewrapInterval),
      freeBond: parseEther(registerArgs.freeBond)
    }

    archLogger.notice("Registering your Archaeologist profile...");
    await profileSetup(finalRegisterArgs);
  }

  async run(options: CommandOptions): Promise<void> {
    if (options.view) {
      // output profile
      const profile = await getOnchainProfile(this.web3Interface);
      logProfile(profile);
    } else {
      await this.registerArchaeologist(options);
    }
  }
}