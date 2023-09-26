import { Command, CommandOptions } from "./command";
import { archLogger } from "../../logger/chalk-theme";
import { isFreeBondProvidedAndZero } from "../shared/profile-validations";
import { freeBondDefinitions } from "../config/free-bond-args";
import { hasAllowance, requestApproval } from "../../scripts/approve_utils";
import { depositFreeBond, withdrawFreeBond } from "../../utils/blockchain/profile";
import { exit } from "process";
import { SUCCESS } from "../../utils/exit-codes";
import { getFreeBondBalance } from "../../utils/onchain-data";
import { NetworkContext } from "network-config";
import { logValidationErrorAndExit } from "cli/utils";
import { getWeb3Interface } from "scripts/web3-interface";

export class FreeBond implements Command {
  name = "free-bond";
  aliases = ["fb"];
  description = "Manage your archaeologist on-chain free bond.";
  args = freeBondDefinitions;
  shouldBeRegistered: boolean;
  networkContext: NetworkContext

  constructor() {
    this.shouldBeRegistered = true;
  }

  validateArgs(options: CommandOptions) {
    if (Object.keys(options).length > 1) {
      archLogger.error("Too many options! Please use one option.\n");
      Object.keys(options).forEach(key => delete options[key]);
      return;
    }

    if (isFreeBondProvidedAndZero(options.deposit || options.withdraw)) {
      archLogger.error("Please indicate a non-zero amount in SARCO");
      Object.keys(options).forEach(key => delete options[key]);
      return;
    }

    const multipleChains = process.env.CHAIN_IDS!.split(",").length > 1;
    if (multipleChains && !options.network) {
      logValidationErrorAndExit("Missing network option. Use --network to specify a network to run this command on.");
    }
  }

  async run(options: CommandOptions): Promise<void> {
    this.networkContext = (await getWeb3Interface()).getNetworkContext(options.network);

    if (options.withdrawAll) {
      await withdrawFreeBond(await getFreeBondBalance(this.networkContext));
    } else if (options.withdraw) {
      await withdrawFreeBond(options.withdraw);
    } else if (options.deposit) {
      if (!(await hasAllowance(options.deposit, this.networkContext))) {
        await requestApproval(this.networkContext);
      }

      await depositFreeBond(options.deposit, this.networkContext);
    } else {
      archLogger.warn("Use:\n");
      archLogger.info("cli help free-bond");
      archLogger.warn("\nto see available options.\n");
    }

    exit(SUCCESS);
  }
}
