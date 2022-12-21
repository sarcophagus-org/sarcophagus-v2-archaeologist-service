import { Command, CommandOptions } from "./command";
import {
  getEthBalance,
  getOnchainProfile,
  getSarcoBalance,
  getSarcophagiIds,
} from "../../utils/onchain-data";
import { Web3Interface } from "../../scripts/web3-interface";
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
  web3Interface: Web3Interface;

  constructor(web3Interface: Web3Interface) {
    this.web3Interface = web3Interface;
  }

  async run(options: CommandOptions): Promise<void> {
    if (Object.keys(options).length === 0) {
      archLogger.warn("Missing options to view. Use `cli help view` to see available options");
      return;
    }

    if (options.sarcophagi) {
      const sarcoIds = await getSarcophagiIds(this.web3Interface);
      logCallout(() => {
        archLogger.info("Your Sarcophagi:\n\n");
        sarcoIds.map(sarcoId => archLogger.info(`${sarcoId}\n`));
      });
    }

    if (options.profile) {
      const profile = await getOnchainProfile(this.web3Interface);
      logProfile(profile);
    }

    if (options.balance) {
      const sarcoBalance = await getSarcoBalance(this.web3Interface);
      const ethBalance = await getEthBalance(this.web3Interface);
      logCallout(() => {
        logBalances(sarcoBalance, ethBalance, this.web3Interface.ethWallet.address);
      });
    }

    if (options.freeBond) {
      const profile = await getOnchainProfile(this.web3Interface);
      logCallout(() => {
        archLogger.info("Your free bond:");
        archLogger.notice(ethers.utils.formatEther(profile.freeBond) + " SARCO");
      });
    }
  }
}
