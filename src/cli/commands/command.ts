import { Web3Interface } from "../../scripts/web3-interface";

export type CommandOptions = {
  [name: string]: any;
};

export interface Command {
  name: string;
  aliases: string[];
  description: string;
  args: any[];
  run(options: CommandOptions, web3Interface?: Web3Interface): Promise<CommandResult | void>;
  validateArgs?(options: CommandOptions);
  web3Interface?: Web3Interface;
  shouldBeRegistered?: boolean;
}

/**
 * A command may return a CommandResult to indicate an exit code.
 */
export class CommandResult {
  constructor(public exitCode: number) {}
}
