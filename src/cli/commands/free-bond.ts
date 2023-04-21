import { Command, CommandOptions } from "./command";
import { archLogger } from "../../logger/chalk-theme";
import { isFreeBondProvidedAndZero } from "../shared/profile-validations";
import { freeBondDefinitions } from "../config/free-bond-args";
import { hasAllowance, requestApproval } from "../../scripts/approve_utils";
import { depositFreeBond, withdrawFreeBond } from "../../utils/blockchain/profile";
import { exit } from "process";
import { SUCCESS } from "../../utils/exit-codes";
import { getFreeBondBalance } from "../../utils/onchain-data";

export class FreeBond implements Command {
  name = "free-bond";
  aliases = ["fb"];
  description = "Manage your archaeologist on-chain free bond.";
  args = freeBondDefinitions;
  shouldBeRegistered: boolean;

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
  }

  async run(options: CommandOptions): Promise<void> {
    if (options.withdrawAll) {
      await withdrawFreeBond(await getFreeBondBalance());
      exit(SUCCESS);
    } else if (options.withdraw) {
      await withdrawFreeBond(options.withdraw);
      exit(SUCCESS);
    } else if (options.deposit) {
      if (!(await hasAllowance(options.deposit))) {
        await requestApproval();
      }

      await depositFreeBond(options.deposit);
      exit(SUCCESS);
    } else {
      archLogger.warn("Use:\n");
      archLogger.info("cli help free-bond");
      archLogger.warn("\nto see available options.\n");
    }
  }
}
