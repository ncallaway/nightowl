import { dir } from "console";
import { readdir } from "fs/promises";
import path from "path";
import { Command } from "../command";

import signale from "signale";
import chalk from "chalk";

const run = async () => {
  const results = await readdir(envDir(), { withFileTypes: true });

  const mapped = results
    .filter((dirent) => dirent.isFile())
    .filter((dirent) => dirent.name.endsWith(".json"))
    .map((dirent) => dirent.name.substring(0, dirent.name.length - 5));

  const first = mapped[0];

  for (const env of mapped) {
    if (env == first) {
      console.log(`${chalk.yellow("•")} ${env}`);
    } else {
      console.log(`  ${env}`);
    }
  }
};

const envDir = () => path.join(".owl", ".env");

export const EnvListCommand: Command = {
  name: "list",
  run,
};
