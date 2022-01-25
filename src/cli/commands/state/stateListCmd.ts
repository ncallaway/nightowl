import chalk from "chalk";
import { CommandLineOptions } from "command-line-args";
import { state } from "../../../core";
import { storeUtil } from "../../lib/storeUtil";
import { Command } from "../command";

export const outputStateList = async (args: CommandLineOptions): Promise<void> => {
  const states = await storeUtil.useStore(async (store) => {
    const resStates = await state.listSummary(args.env, store);

    if (resStates.isErr()) {
      console.error(`\nFailed to load the states (${resStates.error})`);
      process.exit(1);
    }
    return resStates.value;
  });

  for (const state of states) {
    const name = state.name;
    const suffix = ` ${chalk.dim(`(${state.env})`)}`;

    if (state.name == "default") {
      console.log(`  ${chalk.green("•")} ${chalk.green(name)}${suffix}`);
    } else {
      console.log(`    ${name}${suffix}`);
    }
  }
};

export const StateListCommand: Command = {
  name: "list",
  run: outputStateList,
  options: [{ name: "env", alias: "e" }],
};
