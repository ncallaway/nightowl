import chalk from "chalk";
import { Result } from "neverthrow";
import { env } from "../../../core";
import { OwlError } from "../../../core/errors";
import { storeUtil } from "../../lib/storeUtil";
import { Command } from "../command";

export const outputEnvironmentList = async (): Promise<void> => {
  await storeUtil.ensureStore();

  const envs = await env.listSummary();

  const resDef: Result<string | null, OwlError> = await env.getDefault();
  const def = resDef.unwrapOr(null);

  for (const env of envs) {
    const name = env.name;
    if (env.name == def) {
      console.log(`  ${chalk.green("•")} ${chalk.green(name)} ${chalk.dim("(default)")}`);
    } else {
      console.log(`    ${name}`);
    }
  }
};

export const EnvListCommand: Command = {
  name: "list",
  run: outputEnvironmentList,
};
