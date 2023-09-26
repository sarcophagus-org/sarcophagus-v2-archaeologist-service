import { Command, CommandOptions } from "./command";
import { getWeb3Interface } from "../../scripts/web3-interface";
import { exit } from "process";
import { RPC_EXCEPTION, SUCCESS } from "../../utils/exit-codes";
import { NetworkContext } from "network-config";
import { logValidationErrorAndExit } from "cli/utils";
import { archLogger } from "logger/chalk-theme";
import { handleRpcError } from "utils/rpc-error-handler";
import { retryFn } from "utils/blockchain/helpers";

export class Reward implements Command {
  name = "claim";
  aliases = ["c"];
  description = "Claim all rewards you have earned";
  shouldBeRegistered: boolean;
  args = [];
  networkContext: NetworkContext

  constructor() {
    this.shouldBeRegistered = true;
  }

  async withdrawRewards () {
  const { archaeologistFacet } = this.networkContext;

  archLogger.notice("Withdrawing your rewards...");
  setInterval(() => process.stdout.write("."), 1000);

  try {
    const tx = await retryFn(() => archaeologistFacet.withdrawReward());
    await tx.wait();
    archLogger.notice("Success!");
  } catch (error) {
    await handleRpcError(error, this.networkContext);
    exit(RPC_EXCEPTION);
  }
}


  validateArgs(options: CommandOptions) {
    const multipleChains = process.env.CHAIN_IDS!.split(",").length > 1;
    if (multipleChains && !options.network) {
      logValidationErrorAndExit("Missing network option. Use --network to specify a network to run this command on.");
    }
  }

  async run(options: CommandOptions): Promise<void> {
    this.networkContext = (await getWeb3Interface()).getNetworkContext(options.network);
    await this.withdrawRewards();
    exit(SUCCESS);
  }
}
