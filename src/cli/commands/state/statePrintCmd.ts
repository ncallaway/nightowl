import { CommandLineOptions } from "command-line-args";
import { state } from "../../../core";
import { storeUtil } from "../../lib/storeUtil";
import { Command } from "../command";

export const run = async (args: CommandLineOptions): Promise<void> => {
  const stateRes = await storeUtil.useStore(async (store) => {
    return state.get(args.state, args.env, store);
  });

  if (stateRes.isErr()) {
    console.log(`There was a problem loading the state:\n${stateRes.error}`);
    process.exit(1);
  }
  const stateObj = stateRes.value;

  console.log();
  console.log(JSON.stringify(stateObj.value, null, 2));
};

export const StatePrintCommand: Command = {
  name: "print",
  options: [
    { name: "state", defaultOption: true },
    { name: "env", alias: "e" },
  ],
  run,
};
