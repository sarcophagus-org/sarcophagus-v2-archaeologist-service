import { Command, CommandOptions } from "./command";
import { getEthBalance, getOnchainProfile, getSarcoBalance, getSarcophagiIds } from "../../utils/onchain-data";
import { Web3Interface } from "../../scripts/web3-interface";
import { viewOptionDefinitions } from "../config/view-args";
import { logBalances, logProfile } from "../utils";
import { logCallout } from "../../logger/formatter";
import { archLogger } from "../../logger/chalk-theme";

export class View implements Command {
  name = "view";
  aliases = [];
  description =
    "View archaeologist data";
  args = viewOptionDefinitions;
  web3Interface: Web3Interface;

  constructor(web3Interface: Web3Interface) {
    this.web3Interface = web3Interface;
  }

  async run(options: CommandOptions): Promise<void> {
    if (options.sarcophagi) {
      const sarcoIds = await getSarcophagiIds(this.web3Interface);
      logCallout(() => {
        archLogger.info('Sarcophagi:\n\n')
        sarcoIds.map(sarcoId => {
          archLogger.info(`${sarcoId}\n`);
        })
      })
    }

    if (options.profile) {
      const profile = await getOnchainProfile(this.web3Interface);
      logProfile(profile);
    }

    if (options.balance) {
      logCallout(async () => {
        const sarcoBalance = await getSarcoBalance(this.web3Interface);
        const ethBalance = await getEthBalance(this.web3Interface);
        logBalances(sarcoBalance, ethBalance, this.web3Interface.ethWallet.address);
      });
    }
  }
}
