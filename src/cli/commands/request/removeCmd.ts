import { CommandLineOptions } from "command-line-args";
import { request } from "../../../core";
import { unwrap } from "../../lib/errors";
import { Command } from "../command";

const run = async (args: CommandLineOptions): Promise<void> => {
  await unwrap(request.delete(args.request));
}

export const RemoveCommand: Command = {
  name: "remove",
  aliases: ["rm"],
  options: [
    { name: "request", defaultOption: true },
  ],
  run,
};

