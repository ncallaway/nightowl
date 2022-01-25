import { Command } from "../command";
import { StateListCommand } from "./stateListCmd";

export const StateCommand: Command = {
  name: "state",
  subcommands: {
    default: StateListCommand,
    commands: [StateListCommand],
  },
};
