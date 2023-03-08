import { Command, CommandOptions } from "./command";
import { getOnchainProfile } from "../../utils/onchain-data";
import { ONE_MONTH_IN_SECONDS } from "../utils";
import { ProfileCliParams, profileSetup } from "../../scripts/profile-setup";
import { Web3Interface } from "../../scripts/web3-interface";
import { parseEther } from "ethers/lib/utils";
import { startOptionDefinitions } from "../config/start-args";
import { randomTestArchVals } from "../../utils/random-arch-gen";
import { startService } from "../../start_service";

export class Start implements Command {
  name = "start";
  aliases = [];
  description = "Starts the archaeologist service";
  args = startOptionDefinitions;

  defaultProfileParams: ProfileCliParams = {
    diggingFee: parseEther("100"),
    rewrapInterval: 31536000, // 1 year
    maxResTime: ONE_MONTH_IN_SECONDS * 24, // 2 years
    freeBond: parseEther("100"),
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
    const profile = await getOnchainProfile();
    await profileSetup(profileParams, profile.exists, false);
  }

  async run(options: CommandOptions): Promise<void> {
    if (options.randomProfile) {
      await this.registerAndStartRandomArch();
    } else {
      await startService({
        nodeName: "arch",
      });
    }
  }
}
