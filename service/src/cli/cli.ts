import {ParsedCommand} from 'command-line-commands';
import commandLineCommands from 'command-line-commands';
import {Command} from './commands/command';
import { Register } from "./commands/register";
import { handleCommandArgs } from "./utils";
import { getWeb3Interface } from "../scripts/web3-interface";
import { Help } from "./commands/help";

const web3Interface = await getWeb3Interface();

export class ArchaeologistCli {
  commands: Map<string, Command> = new Map();
  args: string[];

  constructor(args: string[]) {
    this.args = args;
    this.addCommand(new Register(web3Interface));
    this.addCommand(new Help(this.commands));
  }

  addCommand(command: Command) {
    this.commands.set(command.name, command);

    command.aliases.forEach((alias) => {
      this.commands.set(alias, command);
    });
  }

  async run () {
    const commandNames = Array.from(this.commands.keys());
    let parsedArgs: ParsedCommand;

    try {
      parsedArgs = commandLineCommands(commandNames, this.args);
    } catch (err) {
      console.log("error in commands", err);
    }

    const command = this.commands.get(parsedArgs.command)!;
    const parsedCliArgs = handleCommandArgs(
      command.args,
      {
        argv: parsedArgs.argv,
        camelCase: true
      }
    );

    return command.run(parsedCliArgs);
  }
}