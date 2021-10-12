import { CommandLineOptions } from "command-line-args";
import { env } from "../../../core";
import { Command } from "../command";

export const run = async (args: CommandLineOptions): Promise<void> => {
  if (!args.envs || args.envs.length != 2) {
    console.log("the old and new environment name must be provided");
    process.exit(1);
  }

  const [oldEnv, newEnv] = args.envs;

  const renameRes = await env.rename(oldEnv, newEnv);

  if (renameRes.isErr()) {
    console.error(`\nCannot rename environment (${renameRes.error})`);
    process.exit(1);
  }
};

export const EnvRenameCommand: Command = {
  name: "rename",
  options: [{ name: "envs", defaultOption: true, multiple: true }],
  run,
};
