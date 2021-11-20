import chalk from "chalk";
import { CommandLineOptions } from "command-line-args";
import _ from "lodash";
import prompts from "prompts";
import { request } from "../../../core";
import { Command } from "../command";

const run = async (args: CommandLineOptions): Promise<void> => {
  if (!args.request) {
    console.log("a request name must be provided");
    process.exit(1);
  }

  const resReqPrompts = await request.getPrompts(args.request, args.env);
  if (resReqPrompts.isErr()) {
    console.error(`\nFailed to prepare request (${resReqPrompts.error})`);
    process.exit(1);
  }
  const reqPrompts = resReqPrompts.value;

  // const requestDefinition = await loadRequest(args.request);
  // let envStr = args.env;
  // if (!envStr) {
  //   const resEnvStr = await env.getActive();
  //   if (resEnvStr.isErr()) {
  //     console.error(`\nFailed to send request (error loading environment: ${resEnvStr.error})`);
  //     process.exit(1);
  //   }
  //   envStr = resEnvStr.value;
  // }
  // // get and issue environment prompts
  // const resEnvPrompts = await env.getPrompts(envStr);
  // if (resEnvPrompts.isErr()) {
  //   console.error(`\nFailed to send request (error loading environment: ${resEnvPrompts.error})`);
  //   process.exit(1);
  // }
  // const envPrompts = resEnvPrompts.value;

  const promptValues = {};

  // prompt and private

  for (const reqPrompt of reqPrompts) {
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
    _.merge(promptValues, op);
  }

  const resReqResult = await request.runRequest(args.request, args.env, promptValues);
  if (resReqResult.isErr()) {
    console.error(`\nFailed to send request (${resReqResult.error})`);
    process.exit(1);
  }
  const reqResult = resReqResult.value;

  // const resLoadedEnv = await env.get(envStr, envPrivates);
  // if (resLoadedEnv.isErr()) {
  //   console.error(`\nFailed to send request (error loading environment: ${resLoadedEnv.error})`);
  //   process.exit(1);
  // }
  // const loadedEnv = resLoadedEnv.value;

  // // // const env = await loadEnv(envStr);
  // const state: State = {};
  // const renderedRequest = await renderRequest(requestDefinition, loadedEnv, state);
  // const requestResult = await issueRequest(renderedRequest);
  console.log("response status: ", reqResult);
};

export const RequestCommand: Command = {
  name: "request",
  options: [
    { name: "request", defaultOption: true },
    { name: "env", alias: "e" },
  ],
  run,
};







