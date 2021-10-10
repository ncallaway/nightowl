import { CommandLineOptions, OptionDefinition } from "command-line-args";
import { EnvCommand } from "./env/envCmd";
import { RequestCommand } from "./request/requestCmd";

export type Command = {
  name: string;
  options?: OptionDefinition[];
  run?: (args: CommandLineOptions) => Promise<void>;
  subcommands?: Subcommand;
};

type Subcommand = {
  default: Command | null;
  commands: Command[];
};

const RootCommand: Command = {
  name: "owl",
  subcommands: {
    default: RequestCommand,
    commands: [RequestCommand, EnvCommand],
  },
};

const getChildCommand = (command: Command, str: string): Command | null => {
  if (!command.subcommands) {
    return null;
  }

  const subCmdNames = command.subcommands.commands.map((cmd) => cmd.name) || [];
  if (subCmdNames.includes(str)) {
    return command.subcommands.commands.find((cmd) => cmd.name == str) || null;
  }
  return command.subcommands.default;
};

export const Commands = {
  getChildCommand,
  RootCommand,
};
