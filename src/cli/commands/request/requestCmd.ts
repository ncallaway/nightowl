import chalk from "chalk";
import { CommandLineOptions } from "command-line-args";
import _ from "lodash";
import prompts from "prompts";
import { request } from "../../../core";
import { argsUtil } from "../../lib/argsUtil";
import { printResponseUtil } from "../../lib/print/printResponseUtil";
import { storeUtil } from "../../lib/storeUtil";
import { Command } from "../command";

const run = async (args: CommandLineOptions): Promise<void> => {
  if (!args.request) {
    console.log("a request name must be provided");
    process.exit(1);
  }

  // load the store
  const res = await storeUtil.useStore(async (store) => {
    const resReqPrompts = await request.getPrompts(args.request, args.env);
    if (resReqPrompts.isErr()) {
      console.error(`\nFailed to prepare request (${resReqPrompts.error})`);
      process.exit(1);
    }
    const reqPrompts = resReqPrompts.value;

    const environmentPrompts = {};
    const requestPrompts: Record<string, unknown> = {};

    if (args._unknown) {
      for (const arg of args._unknown) {
        argsUtil.parseArg(arg, requestPrompts);
      }
    }

    // prompt and private

    for (const reqPrompt of reqPrompts.environment) {
      const response = await prompts({
        type: "password",
        name: "val",
        message: `${reqPrompt.description} (${chalk.dim(reqPrompt.key)})`,
        validate: (value) => (Boolean(value) ? true : `Cannot be empty`),
      });

      if (response.val === undefined) {
        process.exit(0);
      }

      const op = _.set({}, reqPrompt.key, response.val);
      _.merge(environmentPrompts, op);
    }

    for (const reqPrompt of reqPrompts.request) {
      if (requestPrompts[reqPrompt.key]) {
        continue;
      }

      const response = await prompts({
        type: "text",
        name: "val",
        message: `${reqPrompt.description} (${chalk.dim(reqPrompt.key)})`,
        validate: (value) => (Boolean(value) ? true : `Cannot be empty`),
      });

      if (response.val === undefined) {
        process.exit(0);
      }

      const op = _.set({}, reqPrompt.key, response.val);
      _.merge(requestPrompts, op);
    }

    const resReqResult = await request.runRequest(
      args.request,
      args.env,
      args.state,
      environmentPrompts,
      requestPrompts,
      store
    );
    if (resReqResult.isErr()) {
      console.error(`\nFailed to send request (${resReqResult.error})`);
      process.exit(1);
    }
    return resReqResult.value;
  });

  const printOpts = printResponseUtil.printOptionsFromArgs(args);

  await printResponseUtil.print(res, printOpts);
};

export const RequestCommand: Command = {
  name: "request",
  aliases: ["r"],
  options: [
    { name: "request", defaultOption: true },
    { name: "env", alias: "e" },
    { name: "state", alias: "s" },

    ...argsUtil.printOptionsArgs(),
  ],
  run,
};







