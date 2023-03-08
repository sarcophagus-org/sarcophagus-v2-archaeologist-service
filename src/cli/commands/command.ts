export type CommandOptions = {
  [name: string]: any;
};

export interface Command {
  name: string;
  aliases: string[];
  description: string;
  args: any[];
  run(options: CommandOptions): Promise<CommandResult | void>;
  validateArgs?(options: CommandOptions);
  shouldBeRegistered?: boolean;
}

/**
 * A command may return a CommandResult to indicate an exit code.
 */
export class CommandResult {
  constructor(public exitCode: number) {}
}
