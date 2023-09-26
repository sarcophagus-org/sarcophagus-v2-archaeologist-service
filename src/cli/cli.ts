import commandLineCommands from "command-line-commands";
import { Command } from "./commands/command";
import { Register } from "./commands/register";
import { Start } from "./commands/start";
import { handleCommandArgs } from "./utils";
import { Help } from "./commands/help";
import { Update } from "./commands/update";
import { archLogger } from "../logger/chalk-theme";
import { View } from "./commands/view";
import { FreeBond } from "./commands/free-bond";
import { getOnchainProfile } from "../utils/onchain-data";
import { exit } from "process";
import { Reward } from "./commands/reward";
import { NetworkContext } from "network-config";
import { getWeb3Interface } from "scripts/web3-interface";

export class ArchaeologistCli {
  commands: Map<string, Command> = new Map();
  args: string[];
  networkContext: NetworkContext | undefined;

  constructor(args: string[]) {
    this.args = args;
    this.addCommand(new Register());
    this.addCommand(new Update());
    this.addCommand(new Start());
    this.addCommand(new View());
    this.addCommand(new FreeBond());
    this.addCommand(new Reward());
    this.addCommand(new Help(this.commands));
  }

  addCommand(command: Command) {
    this.commands.set(command.name, command);

    command.aliases.forEach(alias => {
      this.commands.set(alias, command);
    });
  }

  async run() {
    const helpCommand = this.commands.get("help")!;
    const commandNames = Array.from(this.commands.keys());
    let parsedArgs;

    try {
      parsedArgs = commandLineCommands(commandNames, this.args);
    } catch (error) {
      if (error.name === "INVALID_COMMAND") {
        if (error.command) {
          archLogger.warn(`'${error.command}' is not an available command.`);
        }
        return helpCommand.run({ command: error.command });
      }

      throw error;
    }

    const command = this.commands.get(parsedArgs.command)!;
    const parsedCliArgs = handleCommandArgs(
      command.args,
      {
        argv: parsedArgs.argv,
        camelCase: true,
      },
      command.name
    );

    if (typeof command.validateArgs === "function") {
      command.validateArgs(parsedCliArgs);
    }

    if (command.shouldBeRegistered === true) {
      const multipleChains = process.env.CHAIN_IDS!.split(",").length > 1;
      if (multipleChains && !parsedCliArgs.network) {
        archLogger.warn(
          "Missing network option. Use --network to specify a network to run this command on."
        );
        return;
      }
      const networkContext = (await getWeb3Interface()).getNetworkContext(parsedCliArgs.network);
      const profile = await getOnchainProfile(networkContext);

      if (!profile.exists) {
        archLogger.error(`Archaeologist is not registered on ${networkContext.networkName} yet! Please run\n`);
        archLogger.info("cli help register\n");
        archLogger.error("for help on registering a profile\n");
        exit(0);
      }
    }

    return command.run(parsedCliArgs);
  }
}
