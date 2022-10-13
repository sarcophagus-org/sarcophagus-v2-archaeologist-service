import {Command, CommandOptions} from './command';
import commandLineUsage from 'command-line-usage';

export class Help implements Command {
  name = 'help';
  aliases = [];

  description = 'Shows this help message, or help for a specific command';

  args = [{
    name: 'command',
    description: 'The command to display help for',
    defaultOption: true,
  }];

  commands: Map<String, Command> = new Map();

  constructor(commands: Map<String, Command>) {
    this.commands = commands;
  }

  generateGeneralUsage() {
    return commandLineUsage([
      {
        header: 'Available Commands',
        content: Array.from(new Set(this.commands.values())).map((command) => {
          return {name: command.name, summary: command.description};
        }),
      },
      {
        header: 'Help for specific command',
        content:
          'Run `cli help <command>` for help with a specific command.',
      }
    ]);
  }

  async generateCommandUsage(command: Command) {
    const usageGroups: commandLineUsage.UsageGroup[] = [
      {
        header: `cli ${command.name}`,
        content: command.description,
      },
      {header: 'Command Options', optionList: command.args},
    ];

    if (command.aliases.length > 0) {
      usageGroups.splice(1, 0, {header: 'Alias(es)', content: command.aliases});
    }

    return commandLineUsage(usageGroups);
  }

  async run(options: CommandOptions) {
    const commandName: string = options['command'];
    if (!commandName) {
      console.log(this.generateGeneralUsage());
      return;
    }

    const command = this.commands.get(commandName);
    if (!command) {
      console.log(this.generateGeneralUsage());
      return;
    }

    console.log(await this.generateCommandUsage(command));
  }
}