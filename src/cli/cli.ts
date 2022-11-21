import commandLineCommands from "command-line-commands";
import { Command } from "./commands/command";
import { Register } from "./commands/register";
import { Start } from "./commands/start";
import { handleCommandArgs } from "./utils";
import { getWeb3Interface } from "../scripts/web3-interface";
import { Help } from "./commands/help";
import { Update } from "./commands/update";
import { archLogger } from "../logger/chalk-theme";
import { View } from "./commands/view";
import jsonfile from "jsonfile";

export class ArchaeologistCli {
  commands: Map<string, Command> = new Map();
  args: string[];

  constructor(args: string[]) {
    this.args = args;
    this.addCommand(new Register());
    this.addCommand(new Update());
    this.addCommand(new Start());
    this.addCommand(new View());
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
        const web3 = await getWeb3Interface(); // TODO, maybe a better signature to run() so do not have to specify for helpcommand, but for all others?
        return helpCommand.run({ command: error.command }, web3);
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

    let archPrivateKey: string | undefined;

    if (parsedCliArgs.configIndex) {
      const peerIdCconfig = await jsonfile.readFile("./hardhat-config-peerids.json");
      archPrivateKey = peerIdCconfig[Number(parsedCliArgs.configIndex)].accountPrivateKey;
    }
    console.log(archPrivateKey);
    const web3Interface = await getWeb3Interface({ archPrivateKey: archPrivateKey });

    return command.run(parsedCliArgs, web3Interface);
  }
}
