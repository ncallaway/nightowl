import { CommandLineOptions } from "command-line-args";
import { state } from "../../../core";
import { storeUtil } from "../../lib/storeUtil";
import { Command } from "../command";

export const run = async (args: CommandLineOptions): Promise<void> => {
  const from = args._unknown && args._unknown[0];
  const to = args._unknown && args._unknown[1];

  if (!from) {
    console.log(`There was a problem move the state:\nNo \`from\` argument was provided.`);
    process.exit(1);
  }

  if (!to) {
    console.log(`There was a problem move the state:\nNo \`to\` argument was provided.`);
    process.exit(1);
  }

  const stateRes = await storeUtil.useStore(async (store) => {
    return state.copy(from, to, args.env, args["to-env"], store);
  });

  if (stateRes.isErr()) {
    console.log(`There was a problem moving the state:\n${stateRes.error}`);
    process.exit(1);
  }
};

export const StateCopyCommand: Command = {
  name: "cp",
  aliases: ["copy"],
  options: [{ name: "env", alias: "e" }, { name: "to-env" }],
  run,
};
