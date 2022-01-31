import { CommandLineOptions } from "command-line-args";
import { argsUtil } from "../../lib/argsUtil";
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
  options: [...argsUtil.printOptionsArgs()],
  run,
};
