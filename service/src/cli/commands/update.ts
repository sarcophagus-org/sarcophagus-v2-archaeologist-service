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

export class Update implements Command {
  name = 'update';
  aliases = ['u'];
  description = 'Updates your archaeologist profile on-chain.';
  args = profileOptionDefinitions;
  web3Interface: Web3Interface;

  constructor(web3Interface: Web3Interface) {
    this.web3Interface = web3Interface;
  }

  async exitUnlessArchaeologistProfileExists() {
    const profile = await getOnchainProfile(this.web3Interface);

    if (!profile.exists) {
      archLogger.notice("Archaeologist is not registered yet!");
      exit(0);
    }
  }

  async updateArchaeologist(updateArgs: any) {
    validateEnvVars();
    await this.exitUnlessArchaeologistProfileExists();

    const finalUpdateArgs: ProfileParams = {
      diggingFee: parseEther(updateArgs.diggingFee),
      rewrapInterval: Number(updateArgs.rewrapInterval),
      freeBond: parseEther(updateArgs.freeBond)
    }

    archLogger.notice("Registering your Archaeologist profile...");
    await profileSetup(finalUpdateArgs, true);
  }

  async run(options: CommandOptions): Promise<void> {
    if (options.view) {
      // output profile
      const profile = await getOnchainProfile(this.web3Interface);
      logProfile(profile);
    } else {
      await this.updateArchaeologist(options);
    }
  }
}