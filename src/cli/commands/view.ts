import { Command, CommandOptions } from "./command";
import {
  getEthBalance,
  getOnchainProfile,
  getRewards,
  getSarcoBalance,
  getSarcophagiIds,
} from "../../utils/onchain-data";
import { getWeb3Interface } from "../../scripts/web3-interface";
import { viewOptionDefinitions } from "../config/view-args";
import { logBalances, logProfile } from "../utils";
import { logCallout } from "../../logger/formatter";
import { archLogger } from "../../logger/chalk-theme";
import { ethers } from "ethers";

export class View implements Command {
  name = "view";
  aliases = [];
  description = "View archaeologist data";
  args = viewOptionDefinitions;

  async run(options: CommandOptions): Promise<void> {
    if (Object.keys(options).length === 0) {
      archLogger.warn("Missing options to view. Use `cli help view` to see available options");
      return;
    }

    if (options.sarcophagi) {
      const sarcoIds = await getSarcophagiIds();
      logCallout(() => {
        archLogger.info("Your Sarcophagi:\n\n");
        sarcoIds.map(sarcoId => archLogger.info(`${sarcoId}\n`));
      });
    }

    if (options.profile) {
      const profile = await getOnchainProfile();
      logProfile(profile);
    }

    if (options.balance) {
      const sarcoBalance = await getSarcoBalance();
      const ethBalance = await getEthBalance();
      const web3Interface = await getWeb3Interface();
      logCallout(() => {
        logBalances(sarcoBalance, ethBalance, web3Interface.ethWallet.address);
      });
    }

    if (options.freeBond) {
      const profile = await getOnchainProfile();
      logCallout(() => {
        archLogger.info("Your free bond:");
        archLogger.notice(ethers.utils.formatEther(profile.freeBond) + " SARCO");
      });
    }

    if (options.cursedBond) {
      const profile = await getOnchainProfile();
      logCallout(() => {
        archLogger.info("Your cursed bond:");
        archLogger.notice(ethers.utils.formatEther(profile.cursedBond) + " SARCO");
      });
    }

    if (options.rewards) {
      const rewards = await getRewards();
      logCallout(() => {
        archLogger.info("Rewards available:");
        archLogger.notice(ethers.utils.formatEther(rewards) + " SARCO");
      });
    }
  }
}
