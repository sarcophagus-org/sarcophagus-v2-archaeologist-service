import { Command, CommandOptions } from "./command";
import { archLogger } from "../../logger/chalk-theme";
import { Web3Interface } from "../../scripts/web3-interface";
import { isFreeBondProvidedAndZero } from "../shared/profile-validations";
import { freeBondDefinitions } from "../config/free-bond-args";
import { hasAllowance, requestApproval } from "../../scripts/approve_utils";
import { depositFreeBond, withdrawFreeBond } from "../../utils/blockchain/profile";
import { exit } from "process";
import { SUCCESS } from "../../utils/exit-codes";

export class FreeBond implements Command {
  name = "free-bond";
  aliases = ["fb"];
  description = "Manage your archaeologist on-chain free bond.";
  args = freeBondDefinitions;
  web3Interface: Web3Interface;
  shouldBeRegistered: boolean;

  constructor(web3Interface: Web3Interface) {
    this.web3Interface = web3Interface;
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
  }

  async run(options: CommandOptions): Promise<void> {
    if (options.withdraw) {
      await withdrawFreeBond(this.web3Interface, options.withdraw);
      exit(SUCCESS);
    } else if (options.deposit) {
      if (!(await hasAllowance(this.web3Interface, options.deposit))) {
        await requestApproval(this.web3Interface);
      }

      await depositFreeBond(this.web3Interface, options.deposit);
      exit(SUCCESS);
    } else {
      archLogger.warn("Use:\n");
      archLogger.info("cli help free-bond");
      archLogger.warn("\nto see available options.\n");
    }
  }
}
