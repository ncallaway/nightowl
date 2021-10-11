import chalk from "chalk";
import { CommandLineOptions } from "command-line-args";
import { Result } from "neverthrow";
import { env } from "../../../core";
import { Command } from "../command";

export const run = async (args: CommandLineOptions) => {
  let envName = args.env;
  if (!envName) {
    envName = (await env.getDefault()).unwrapOr("");
  }

  if (!envName) {
    console.log("no environment was provided, and not default exists. Nothing to print.");
    process.exit(1);
  }

  const envRes = await env.get(envName);

  if (envRes.isErr()) {
    console.log(`There was a problem loading the environment:\n${envRes.error}`);
    process.exit(1);
  }

  console.log();
  console.log(JSON.stringify(envRes.value, null, 2));
};

export const EnvPrintCommand: Command = {
  name: "print",
  options: [{ name: "env", defaultOption: true }],
  run,
};
