import { Command } from "../command";
import { EnvDefaultCommand } from "./envDefaultCmd";
import { EnvListCommand } from "./envListCmd";

export const EnvCommand: Command = {
  name: "env",
  subcommands: {
    default: EnvListCommand,
    commands: [EnvListCommand, EnvDefaultCommand],
  },
};
