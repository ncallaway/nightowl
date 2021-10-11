import { CommandLineOptions } from "command-line-args";
import { env } from "../../../core";
import { Command } from "../command";
import { outputEnvironmentList } from "./envListCmd";

const run = async (args: CommandLineOptions) => {
  if (!args.env) {
    console.log("a default environment must be provided");
    process.exit(1);
  }
  const result = await env.setDefault(args.env);

  if (result.isOk()) {
    await outputEnvironmentList();
  } else {
    console.log("Failed to update default: ", result.error);
  }
};

export const EnvDefaultCommand: Command = {
  name: "default",
  options: [{ name: "env", defaultOption: true }],
  run,
};
