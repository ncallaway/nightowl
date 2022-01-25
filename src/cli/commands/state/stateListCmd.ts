import chalk from "chalk";
import { CommandLineOptions } from "command-line-args";
import { state, store } from "../../../core";
import { Command } from "../command";

export const outputStateList = async (args: CommandLineOptions): Promise<void> => {
  const resOwlStore = await store.openStore();
  if (resOwlStore.isErr()) {
    console.error(`\nFailed to open the data store (${resOwlStore.error})`);
    process.exit(1);
  }
  const owlStore = resOwlStore.value;

  const resStates = await state.listSummary(args.env, owlStore);

  if (resStates.isErr()) {
    console.error(`\nFailed to load the states (${resStates.error})`);
    process.exit(1);
  }
  const states = resStates.value;

  await store.closeStore(owlStore);

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
