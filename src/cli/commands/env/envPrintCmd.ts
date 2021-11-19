import { CommandLineOptions } from "command-line-args";
import _ from "lodash";
import { env } from "../../../core";
import { Command } from "../command";

export const run = async (args: CommandLineOptions): Promise<void> => {
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

  const envValues = envRes.value;

  if (!args["show-private"]) {
    const envPrivateRes = await env.getPrivateKeys(envName);
    if (envPrivateRes.isErr()) {
      console.log(`There was a problem loading the environment:\n${envPrivateRes.error}`);
      process.exit(1);
    }

    const envPrivates = envPrivateRes.value;

    for (const envPrivate of envPrivates) {
      const val = _.get(envValues, envPrivate.key);
      if (val !== undefined) {
        _.set(envValues, envPrivate.key, "••••••••");
      }
    }
  }

  console.log();
  console.log(JSON.stringify(envValues, null, 2));
};

export const EnvPrintCommand: Command = {
  name: "print",
  options: [
    { name: "env", defaultOption: true },
    { name: "show-private", type: Boolean, defaultValue: false },
  ],
  run,
};
