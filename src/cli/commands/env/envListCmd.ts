import { dir } from "console";
import { readdir } from "fs/promises";
import path from "path";
import { Command } from "../command";

import signale from "signale";
import chalk from "chalk";
import { env } from "../../../core";

const run = async () => {
  const envs = await env.listSummary();

  const def = await env.defaultEnvironment();

  for (const env of envs) {
    const name = env.name;
    if (env.name == def) {
      console.log(`  ${chalk.green("•")} ${chalk.green(name)}`);
    } else {
      console.log(`    ${name}`);
    }
  }
};


export const EnvListCommand: Command = {
  name: "list",
  run,
};
