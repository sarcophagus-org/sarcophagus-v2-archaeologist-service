import { Command, CommandOptions } from "./command";
import { getOnchainProfile } from "../../utils/onchain-data";
import { randomIntFromInterval } from "../utils";
import { ProfileParams, profileSetup } from "../../scripts/profile-setup";
import { Web3Interface } from "../../scripts/web3-interface";
import { parseEther } from "ethers/lib/utils";
import { startOptionDefinitions } from "../config/start-args";
import { randomTestArchVals } from "../../utils/random-arch-gen";
import { startService } from "../../start_service";
import jsonfile from "jsonfile";
import { createFromJSON } from "@libp2p/peer-id-factory";
import { genListenAddresses } from "../../utils/listen-addresses";

export class Start implements Command {
  name = "start";
  aliases = [];
  description = "Starts the archaeologist service";
  args = startOptionDefinitions;
  web3Interface: Web3Interface;

  defaultProfileParams: ProfileParams = {
    diggingFee: parseEther("10"),
    rewrapInterval: Number(31536000), // 1 year
    freeBond: parseEther("100"),
  };

  async registerAndStartRandomArch() {
    const { peerId, listenAddresses } = await randomTestArchVals({});

    this.defaultProfileParams.peerId = peerId.toString();
    await this.registerOrUpdateArchaeologist(this.defaultProfileParams);

    await startService({
      nodeName: `random arch`,
      web3Interface: this.web3Interface,
      peerId,
      listenAddresses,
    });
  }

  async registerOrUpdateArchaeologist(profileParams: ProfileParams) {
    const profile = await getOnchainProfile(this.web3Interface);
    await profileSetup(profileParams, this.web3Interface, profile.exists, false);
  }

  async registerAndStartUsingConfigFile(configIndex: number) {
    const peerIdConfig = await jsonfile.readFile("./hardhat-config-peerids.json");
    const peerIdData = peerIdConfig[configIndex];
    const peerId = await createFromJSON({
      id: peerIdData.id,
      privKey: peerIdData.privKey,
      pubKey: peerIdData.pubKey,
    });
    // const listenAddresses = genListenAddresses(["127.0.0.1"], peerIdData.id, true);
    // console.log(listenAddresses);
    this.defaultProfileParams.peerId = peerId.toString();
    await this.registerOrUpdateArchaeologist(this.defaultProfileParams);
    await startService({
      nodeName: this.web3Interface.ethWallet.address,
      web3Interface: this.web3Interface,
      peerId,
    }); 
  }

  async run(options: CommandOptions, web3Interface: Web3Interface): Promise<void> {
    this.web3Interface = web3Interface;
    if (options.randomProfile) {
      await this.registerAndStartRandomArch();
    }
    if (options.configIndex) {
      await this.registerAndStartUsingConfigFile(Number(options.configIndex));
    } else {
      await startService({
        nodeName: "arch",
        web3Interface: this.web3Interface,
      });
    }
  }
}



