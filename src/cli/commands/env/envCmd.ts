import { Command } from "../command";
import { EnvDefaultCommand } from "./envDefaultCmd";
import { EnvListCommand } from "./envListCmd";
import { EnvPrintCommand } from "./envPrintCmd";
import { EnvCreateCommand } from "./envCreateCmd";
import { EnvDeleteCommand } from "./envDeleteCmd";

export const EnvCommand: Command = {
  name: "env",
  subcommands: {
    default: EnvListCommand,
    commands: [EnvListCommand, EnvDefaultCommand, EnvPrintCommand, EnvCreateCommand, EnvDeleteCommand],
  },
};
