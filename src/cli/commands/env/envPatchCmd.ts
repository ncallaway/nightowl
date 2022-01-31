import { CommandLineOptions } from "command-line-args";
import { env } from "../../../core";
import { argsUtil } from "../../lib/argsUtil";
import { Command } from "../command";

export const run = async (args: CommandLineOptions): Promise<void> => {
  if (!args.env) {
    console.log("the new environment name must be provided");
    process.exit(1);
  }

  const { values, privates } = argsUtil.parseEnvPutPatchArgs(args);

  const updateRes = await env.update(args.env, values, privates, true);
  if (updateRes.isErr()) {
    console.error(`\nCannot update environment (${updateRes.error})`);
    process.exit(1);
  }
};

export const EnvPatchCommand: Command = {
  name: "patch",
  options: [
    { name: "env", defaultOption: true },
    { name: "unset", alias: "u", multiple: true },
    { name: "private", alias: "p", lazyMultiple: true },
  ],
  run,
};
