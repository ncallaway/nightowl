import { CommandLineOptions } from "command-line-args";
import { env } from "../../../core";
import { Command } from "../command";

export const run = async (args: CommandLineOptions): Promise<void> => {
  if (!args.env) {
    console.log("the new environment name must be provided");
    process.exit(1);
  }

  const deleteRes = await env.delete(args.env);

  if (deleteRes.isErr()) {
    console.error(`\nCannot remove environment (${deleteRes.error})`);
    process.exit(1);
  }
};

export const EnvDeleteCommand: Command = {
  name: "remove",
  options: [{ name: "env", defaultOption: true }],
  run,
};
