import { CommandLineOptions, OptionDefinition } from "command-line-args";
import { EnvCommand } from "./env/envCmd";
import { RequestCommand } from "./request/requestCmd";
import { StateCommand } from "./state/stateCmd";

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
    commands: [RequestCommand, EnvCommand, StateCommand],
  },
  options: [{ name: "cmd", defaultOption: true }],
};

const getExplicitChildCommand = (command: Command, str: string): Command | null => {
  if (!command.subcommands) {
    return null;
  }

  const subCmdNames = command.subcommands.commands.map((cmd) => cmd.name) || [];
  if (subCmdNames.includes(str)) {
    return command.subcommands.commands.find((cmd) => cmd.name == str) || null;
  }
  return null;
};

const getChildCommand = (command: Command, str: string): Command | null => {
  const explicit = getExplicitChildCommand(command, str);

  if (explicit) {
    return explicit;
  }

  return command.subcommands?.default || null;
};

export const Commands = {
  getChildCommand,
  getExplicitChildCommand,
  RootCommand,
};