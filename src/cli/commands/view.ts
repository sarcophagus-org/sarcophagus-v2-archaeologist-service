import { Command, CommandOptions } from "./command";
import {
  CursedArchaeologist,
  getNetworkTokenBalance,
  getOnchainProfile,
  getRewards,
  getSarcoBalance,
  SarcophagusContract,
  SarcophagusDataSimple,
} from "../../utils/onchain-data";
import { getWeb3Interface } from "../../scripts/web3-interface";
import { viewOptionDefinitions } from "../config/view-args";
import { logBalances, logProfile } from "../utils";
import { logCallout } from "../../logger/formatter";
import { archLogger } from "../../logger/chalk-theme";
import { ethers } from "ethers";

import fs from "fs/promises";
import { SubgraphData } from "../../utils/graphql";
import { validateEnvVars } from "../../utils/validateEnv";
import { exit } from "process";
import { SUCCESS } from "../../utils/exit-codes";
import { NetworkContext } from "network-config";

export class View implements Command {
  name = "view";
  aliases = [];
  description = "View archaeologist data";
  args = viewOptionDefinitions;
  networkContext: NetworkContext | undefined;

  async exportToCsv(name: string, content: any) {
    try {
      const filename = `${name}.csv`;
      await fs.writeFile(filename, content, { flag: "w+" });
      archLogger.info(`Exported output to file: ${filename}`);
    } catch (err) {
      archLogger.error("Failed to export csv", { logTimestamp: true });
      archLogger.error(err, { logTimestamp: true });
    }
  }

  validateArgs(options: CommandOptions) {
    const multipleChains = process.env.CHAIN_IDS!.split(",").length > 1;
    if (multipleChains && !options.network) {
      archLogger.warn(
        "Missing network option. Use --network to specify a network to run this command on."
      );
      return;
    }
  }

  async run(options: CommandOptions): Promise<void> {
    validateEnvVars();

    if (Object.keys(options).length === 0) {
      archLogger.warn("Missing options to view. Use `cli help view` to see available options");
      return;
    }



    this.networkContext = (await getWeb3Interface()).getNetworkContext(options.network);

    if (options.sarcophagusDetails) {
      const { viewStateFacet, ethWallet } = this.networkContext;

      const sarcoId = options.sarcophagusDetails;
      const subgraphSarco = await SubgraphData.getSarcophagus(sarcoId);

      const sarco: SarcophagusContract = await viewStateFacet.getSarcophagus(sarcoId);
      const cursedArchData: CursedArchaeologist = await viewStateFacet.getSarcophagusArchaeologist(
        sarcoId,
        ethWallet.address
      );

      logCallout(() => {
        archLogger.notice("Sarcophagus Details:\n");
        if (subgraphSarco) archLogger.info(`  Created: ${subgraphSarco.creationDate}`);
        if (subgraphSarco) archLogger.info(`  Number of rewraps: ${subgraphSarco.rewrapCount}`);
        archLogger.info(
          `  Resurrection: ${
            subgraphSarco ? subgraphSarco.resurrectionTime : sarco.resurrectionTime.toNumber()
          }`
        );
        archLogger.info(
          `  Per-second Fee: ${ethers.utils.formatEther(cursedArchData.diggingFeePerSecond)}`
        );
        archLogger.info(`  Curse fee: ${ethers.utils.formatEther(cursedArchData.curseFee)}`);
        archLogger.info(`  Accused: ${cursedArchData.isAccused}`);
        archLogger.info(`  Unwrapped: ${cursedArchData.privateKey !== ethers.constants.HashZero}`);
        if (subgraphSarco) archLogger.info(`  Status: ${subgraphSarco.curseStatus}`);
      });
    }

    if (options.sarcophagi) {
      const logSarcos = (title: string, subgraphSarcos: SarcophagusDataSimple[]) => {
        logCallout(() => {
          archLogger.info(`${title}:\n\n`);
          subgraphSarcos.map(sarco => {
            archLogger.notice(`${sarco.id}`);
            archLogger.info(`  Created: ${sarco.creationDate}`);
            archLogger.info(`  Resurrection: ${sarco.resurrectionTime}`);
            archLogger.info(`  Status: ${sarco.curseStatus}\n`);
          });

          archLogger.notice(`\nTotal: ${subgraphSarcos.length}`);
        });
      };

      if (options.inactiveCurses) {
        logSarcos("Past Sarcophagi", await SubgraphData.getPastSarcophagi());
      }

      if (options.activeCurses) {
        logSarcos("Current Sarcophagi", await SubgraphData.getActiveSarcophagi());
      }

      if (options.inactiveCurses || options.activeCurses) return;

      const subgraphSarcos = await SubgraphData.getSarcophagi();
      logSarcos("Your Sarcophagi", subgraphSarcos);

      if (options.export) {
        this.exportToCsv(
          "sarcophagi",
          subgraphSarcos
            .map(s => `${s.id}|${s.creationDate.getSeconds()}|${s.resurrectionTime.getSeconds()}`)
            .join(",")
        );
      }
    }

    if (options.stats) {
      const stats = await SubgraphData.getArchStats();

      logCallout(() => {
        archLogger.notice("Your Stats:\n\n");
        archLogger.info(`  Unwraps: ${stats.successes}`);
        archLogger.info(`  Failures: ${stats.fails}`);
        archLogger.info(`  Accusals: ${stats.accusals}`);
      });
    }

    if (options.profile) {
      const profile = await getOnchainProfile(this.networkContext);
      const formattedProfile = logProfile(this.networkContext.networkName, profile);

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
      const sarcoBalance = await getSarcoBalance(this.networkContext);
      const ethBalance = await getNetworkTokenBalance(this.networkContext);
      const { ethWallet, networkName, networkConfig } = this.networkContext;
      logCallout(() => {
        logBalances(
          networkName, 
          networkConfig.tokenSymbol,
          sarcoBalance,
          ethBalance, 
          ethWallet.address
        );
      });

      if (options.export) {
        this.exportToCsv(
          "balances",
          `SARCO:${sarcoBalance.toString()},ETH:${ethBalance.toString()}`
        );
      }
    }

    if (options.freeBond) {
      const profile = await getOnchainProfile(this.networkContext);
      logCallout(() => {
        archLogger.info("Your free bond:");
        archLogger.notice(ethers.utils.formatEther(profile.freeBond) + " SARCO");
      });
    }

    if (options.cursedBond) {
      const profile = await getOnchainProfile(this.networkContext);
      logCallout(() => {
        archLogger.info("Your cursed bond:");
        archLogger.notice(ethers.utils.formatEther(profile.cursedBond) + " SARCO");
      });
    }

    if (options.rewards) {
      const rewards = await getRewards(this.networkContext);
      logCallout(() => {
        archLogger.info("Rewards available:");
        archLogger.notice(ethers.utils.formatEther(rewards) + " SARCO");
      });

      if (options.export) {
        this.exportToCsv("rewards", `${rewards.toString()}`);
      }
    }

    exit(SUCCESS);
  }
}
