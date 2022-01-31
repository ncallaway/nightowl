import { CommandLineOptions } from "command-line-args";
import { state } from "../../../core";
import { argsUtil } from "../../lib/argsUtil";
import { storeUtil } from "../../lib/storeUtil";
import { Command } from "../command";

export const run = async (args: CommandLineOptions): Promise<void> => {
  if (argsUtil.parseArg(args.state, {})) {
    args._unknown = args._unknown || [];
    args._unknown.push(args.state);
    args.state = undefined;
  }

  const { values } = argsUtil.parseEnvPutPatchArgs(args);

  const updateRes = await storeUtil.useStore(async (store) => {
    return state.update(args.state, args.env, values, store, true);
  });

  if (updateRes.isErr()) {
    console.error(`\nCannot update state (${updateRes.error})`);
    process.exit(1);
  }
};

export const StatePatchCommand: Command = {
  name: "patch",
  options: [
    { name: "state", defaultOption: true },
    { name: "env", alias: "e" },
    { name: "unset", alias: "u", multiple: true },
  ],
  run,
};
