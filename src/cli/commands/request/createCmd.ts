import { CommandLineOptions } from "command-line-args";
import { quote } from 'shell-quote';
import { request } from "../../../core";
import { unwrap } from "../../lib/errors";
import { Command } from "../command";

const run = async (args: CommandLineOptions): Promise<void> => {
  if (args._unknown && args._unknown.length > 1 && args._unknown[0] == '--') {
    const importStr = quote(args._unknown.slice(1));
    const resConvert = request.convert(importStr);
    const definition = await unwrap(resConvert);

    await unwrap(request.create(args.request, definition));
  }
}

export const CreateCommand: Command = {
  name: "create",
  options: [
    { name: "request", defaultOption: true },
    // todo: other args?
  ],
  run,
};

