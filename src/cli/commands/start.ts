import { Command, CommandOptions } from "./command";
import { getOnchainProfile } from "../../utils/onchain-data";
import { randomIntFromInterval } from "../utils";
import { ProfileParams, profileSetup } from "../../scripts/profile-setup";
import { Web3Interface } from "../../scripts/web3-interface";
import { parseEther } from "ethers/lib/utils";
import { startOptionDefinitions } from "../config/start-args";
import { randomTestArchVals } from "../../utils/random-arch-gen";
import { startService } from "../../start_service";

export class Start implements Command {
  name = "start";
  aliases = [];
  description =
    "Starts the archaeologist service";
  args = startOptionDefinitions;
  web3Interface: Web3Interface;

  constructor(web3Interface: Web3Interface) {
    this.web3Interface = web3Interface;
  }

  defaultProfileParams: ProfileParams = {
    diggingFee: parseEther("10"),
    rewrapInterval: Number(31536000), // 1 year
    freeBond: parseEther("100")
  }

  async registerAndStartRandomArch() {
    const {peerId, listenAddresses} = await randomTestArchVals({});

    this.defaultProfileParams.peerId = peerId.toString();
    await this.registerOrUpdateArchaeologist(this.defaultProfileParams);

    await startService({
      nodeName: `random arch`,
      peerId,
      listenAddresses
    })
  }

  async registerOrUpdateArchaeologist(profileParams: ProfileParams) {
    const profile = await getOnchainProfile(this.web3Interface);
    await profileSetup(profileParams, profile.exists, false);
  }

  async run(options: CommandOptions): Promise<void> {
    if (options.randomProfile) {
      await this.registerAndStartRandomArch();
    } else {
      await startService({
          nodeName: 'arch'
        }
      );
    }
  }
}
