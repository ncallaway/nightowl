import { Command } from "../command";
import { EnvListCommand } from "./envListCmd";

export const EnvCommand: Command = {
  name: "env",
  subcommands: {
    default: null,
    commands: [EnvListCommand],
  },
};
