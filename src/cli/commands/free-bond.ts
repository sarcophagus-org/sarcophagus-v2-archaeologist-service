import { Command, CommandOptions } from "./command";
import { archLogger } from "../../logger/chalk-theme";
import { isFreeBondProvidedAndZero } from "../shared/profile-validations";
import { freeBondDefinitions } from "../config/free-bond-args";
import { hasAllowance, requestApproval } from "../../scripts/approve_utils";
import { exit } from "process";
import { RPC_EXCEPTION, SUCCESS } from "../../utils/exit-codes";
import { getFreeBondBalance } from "../../utils/onchain-data";
import { NetworkContext } from "../../network-config";
import { logValidationErrorAndExit } from "../../cli/utils";
import { getWeb3Interface } from "../../scripts/web3-interface";
import { BigNumber } from "ethers";
import { retryFn } from "../../utils/blockchain/helpers";
import { handleRpcError } from "../../utils/rpc-error-handler";

export class FreeBond implements Command {
  name = "free-bond";
  aliases = ["fb"];
  description = "Manage your archaeologist on-chain free bond.";
  args = freeBondDefinitions;
  shouldBeRegistered: boolean;
  networkContext: NetworkContext;

  constructor() {
    this.shouldBeRegistered = true;
  }

  validateArgs(options: CommandOptions) {
    if (isFreeBondProvidedAndZero(options.deposit || options.withdraw)) {
      archLogger.error("Please indicate a non-zero amount in SARCO");
      Object.keys(options).forEach(key => delete options[key]);
      return;
    }

    const multipleChains = process.env.CHAIN_IDS!.split(",").length > 1;
    if (multipleChains && !options.network) {
      logValidationErrorAndExit(
        "Missing network option. Use --network to specify a network to run this command on."
      );
    }
  }

  async depositFreeBond(amt: BigNumber) {
    const { archaeologistFacet } = this.networkContext;

    archLogger.notice("Depositing free bond...");

    if (!(await hasAllowance(amt, this.networkContext))) {
      await requestApproval(this.networkContext);
    }

    setInterval(() => process.stdout.write("."), 1000);

    try {
      const tx = await retryFn(() => archaeologistFacet.depositFreeBond(amt));
      await tx.wait();
      archLogger.notice("Success!");
    } catch (error) {
      await handleRpcError(error, this.networkContext);
      exit(RPC_EXCEPTION);
    }
  }

  async withdrawFreeBond(amt: BigNumber) {
    const { archaeologistFacet } = this.networkContext;

    archLogger.notice("Withdrawing free bond...");
    setInterval(() => process.stdout.write("."), 1000);

    try {
      const tx = await retryFn(() => archaeologistFacet.withdrawFreeBond(amt));
      await tx.wait();
      archLogger.notice("Success!");
    } catch (error) {
      await handleRpcError(error, this.networkContext);
      exit(RPC_EXCEPTION);
    }
  }

  async run(options: CommandOptions): Promise<void> {
    this.networkContext = (await getWeb3Interface()).getNetworkContext(options.network);

    if (options.withdrawAll) {
      await this.withdrawFreeBond(await getFreeBondBalance(this.networkContext));
    } else if (options.withdraw) {
      await this.withdrawFreeBond(options.withdraw);
    } else if (options.deposit) {
      if (!(await hasAllowance(options.deposit, this.networkContext))) {
        await requestApproval(this.networkContext);
      }

      await this.depositFreeBond(options.deposit);
    } else {
      archLogger.warn("Use:\n");
      archLogger.info("cli help free-bond");
      archLogger.warn("\nto see available options.\n");
    }

    exit(SUCCESS);
  }
}
