import { Command, CommandOptions } from "./command";
import { Web3Interface } from "../../scripts/web3-interface";
import { withdrawRewards } from "../../utils/blockchain/profile";
import { exit } from "process";
import { SUCCESS } from "../../utils/exit-codes";

export class Reward implements Command {
  name = "claim";
  aliases = ["c"];
  description = "Claim all rewards you have earned";
  web3Interface: Web3Interface;
  shouldBeRegistered: boolean;
  args = [];

  constructor(web3Interface: Web3Interface) {
    this.web3Interface = web3Interface;
    this.shouldBeRegistered = true;
  }

  async run(options: CommandOptions): Promise<void> {
    await withdrawRewards(this.web3Interface);
    exit(SUCCESS);
  }
}
