import chalk from "chalk";
import { CommandLineOptions } from "command-line-args";
import { Result } from "neverthrow";
import { env } from "../../../core";
import { Command } from "../command";

const run = async (args: CommandLineOptions) => {
  if (!args.env) {
    console.log("a default environment must be provided");
    process.exit(1);
  }
  console.log("SETTING DEFAULT TO: ", args.env);
  const result = await env.setDefault(args.env);

  if (result.isOk()) {
    console.log("Default set to: ", args.env);
  } else {
    console.log("Failed to update default: ", result.error);
  }



};

export const EnvDefaultCommand: Command = {
  name: "default",
  options: [{ name: "env", defaultOption: true }],
  run,
};
