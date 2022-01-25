import { CommandLineOptions } from "command-line-args";
import { state } from "../../../core";
import { storeUtil } from "../../lib/storeUtil";
import { Command } from "../command";

export const run = async (args: CommandLineOptions): Promise<void> => {
  const stateRes = await storeUtil.useStore(async (store) => {
    return state.clear(args.state, args.env, store);
  });

  if (stateRes.isErr()) {
    console.log(`There was a problem clearing the state:\n${stateRes.error}`);
    process.exit(1);
  }
};

export const StateClearCommand: Command = {
  name: "clear",
  options: [
    { name: "state", defaultOption: true },
    { name: "env", alias: "e" },
  ],
  run,
};
