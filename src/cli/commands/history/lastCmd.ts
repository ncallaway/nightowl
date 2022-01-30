import { CommandLineOptions } from "command-line-args";
import { Command } from "../command";
import { ShowCommand } from "./showCmd";

const run = async (args: CommandLineOptions): Promise<void> => {
  args.which = 1;
  if (ShowCommand.run) {
    ShowCommand.run(args);
  }

};

export const LastCommand: Command = {
  name: "last",
  options: [
    { name: "verbose", alias: "v", type: Boolean },
    { name: "include", alias: "i", type: Boolean },
    { name: "status", type: Boolean },
    { name: "url", type: Boolean },
  ],
  run,
};
