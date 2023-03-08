import { Command, CommandOptions } from "./command";
import { Web3Interface } from "../../scripts/web3-interface";
import { withdrawRewards } from "../../utils/blockchain/profile";
import { exit } from "process";
import { SUCCESS } from "../../utils/exit-codes";

export class Reward implements Command {
  name = "claim";
  aliases = ["c"];
  description = "Claim all rewards you have earned";
  shouldBeRegistered: boolean;
  args = [];

  constructor() {
    this.shouldBeRegistered = true;
  }

  async run(options: CommandOptions): Promise<void> {
    await withdrawRewards();
    exit(SUCCESS);
  }
}
