import { Command, CommandOptions } from "./command";
import { getOnchainProfile } from "../../utils/onchain-data";
import { ONE_MONTH_IN_SECONDS, logValidationErrorAndExit } from "../utils";
import { ProfileCliParams, profileSetup } from "../../scripts/profile-setup";
import { parseEther } from "ethers/lib/utils";
import { startOptionDefinitions } from "../config/start-args";
import { randomTestArchVals } from "../../utils/random-arch-gen";
import { startService } from "../../start_service";
import { NetworkContext } from "../../network-config";
import { getWeb3Interface } from "../../scripts/web3-interface";

export class Start implements Command {
  name = "start";
  aliases = [];
  description = "Starts the archaeologist service";
  args = startOptionDefinitions;
  networkContext: NetworkContext;

  defaultProfileParams: ProfileCliParams = {
    diggingFee: parseEther("100"),
    rewrapInterval: 31536000, // 1 year
    maxResTime: ONE_MONTH_IN_SECONDS * 24, // 2 years
    freeBond: parseEther("100"),
    curseFee: parseEther("10"),
  };

  async registerAndStartRandomArch() {
    const { peerId, listenAddresses } = await randomTestArchVals({});

    this.defaultProfileParams.peerId = peerId.toString();
    await this.registerOrUpdateArchaeologist(this.defaultProfileParams);

    await startService({
      nodeName: `random arch`,
      peerId,
      listenAddresses,
    });
  }

  async registerOrUpdateArchaeologist(profileParams: ProfileCliParams) {
    const profile = await getOnchainProfile(this.networkContext);
    await profileSetup(profileParams, this.networkContext, profile.exists, false);
  }

  validateArgs(options: CommandOptions) {
    const multipleChains = process.env.CHAIN_IDS!.split(",").length > 1;
    if (multipleChains && !options.network) {
      logValidationErrorAndExit("Missing network option. Use --network to specify a network to run this command on.");
    }
  }

  async run(options: CommandOptions): Promise<void> {
    this.networkContext = (await getWeb3Interface()).getNetworkContext(options.network);

    if (options.randomProfile) {
      await this.registerAndStartRandomArch();
    } else {
      await startService({
        nodeName: "arch",
      });
    }
  }
}
