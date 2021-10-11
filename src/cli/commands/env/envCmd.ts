import { Command } from "../command";
import { EnvDefaultCommand } from "./envDefaultCmd";
import { EnvListCommand } from "./envListCmd";
import { EnvPrintCommand } from "./envPrintCmd";

export const EnvCommand: Command = {
  name: "env",
  subcommands: {
    default: EnvListCommand,
    commands: [EnvListCommand, EnvDefaultCommand, EnvPrintCommand],
  },
};
