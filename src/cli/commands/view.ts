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

import fs from "fs/promises";
import { SubgraphData } from "../../utils/graphql";

export class View implements Command {
  name = "view";
  aliases = [];
  description = "View archaeologist data";
  args = viewOptionDefinitions;

  async exportToCsv(name: string, content: any) {
    try {
      const filename = `${name}.csv`;
      await fs.writeFile(filename, content, { flag: "w+" });
      archLogger.info(`Exported output to file: ${filename}`);
    } catch (err) {
      archLogger.error("Failed to export csv", true);
      archLogger.error(err, true);
    }
  }

  async run(options: CommandOptions): Promise<void> {
    if (Object.keys(options).length === 0) {
      archLogger.warn("Missing options to view. Use `cli help view` to see available options");
      return;
    }

    if (options.sarcophagi) {
      const subgraphSarcos = await SubgraphData.getSarcophagi();

      logCallout(() => {
        archLogger.info("Your Sarcophagi:\n\n");
        subgraphSarcos.map(sarco => {
          archLogger.info(`${sarco.sarcoId}`);
          archLogger.info(`Created: ${sarco.blockTimestamp}\n`);
          archLogger.info(`Resurrection: ${sarco.resurrectionTime}\n`);
        });
      });

      if (options.export) {
        this.exportToCsv("sarcophagi", subgraphSarcos.map(s => `${s.sarcoId}|${s.blockTimestamp}|${s.resurrectionTime}`).join(","));
      }
    }

    if (options.profile) {
      const profile = await getOnchainProfile();
      const formattedProfile = logProfile(profile);

      if (options.export) {
        this.exportToCsv(
          "profile",
          Object.entries(formattedProfile)
            .map(([key, value]) => `${key}:"${value}"`)
            .join(",")
        );
      }
    }

    if (options.balance) {
      const sarcoBalance = await getSarcoBalance();
      const ethBalance = await getEthBalance();
      const web3Interface = await getWeb3Interface();
      logCallout(() => {
        logBalances(sarcoBalance, ethBalance, web3Interface.ethWallet.address);
      });

      if (options.export) {
        this.exportToCsv(
          "balances",
          `SARCO:${sarcoBalance.toString()},ETH:${ethBalance.toString()}`
        );
      }
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

      if (options.export) {
        this.exportToCsv("rewards", `${rewards.toString()}`);
      }
    }
  }
}
