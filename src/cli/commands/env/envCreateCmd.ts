import { CommandLineOptions } from "command-line-args";
import { env } from "../../../core";
import { Command } from "../command";

export const run = async (args: CommandLineOptions): Promise<void> => {
  if (!args.env) {
    console.log("the new environment name must be provided");
    process.exit(1);
  }

  const createRes = await env.create(args.env);

  if (createRes.isErr()) {
    console.error(`\nCannot add environment (${createRes.error})`);
    process.exit(1);
  }
};

export const EnvCreateCommand: Command = {
  name: "create",
  options: [{ name: "env", defaultOption: true }],
  run,
};
