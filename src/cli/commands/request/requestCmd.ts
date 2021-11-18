import chalk from "chalk";
import { CommandLineOptions } from "command-line-args";
import { readFile } from "fs/promises";
import _ from "lodash";
import nunjucks from "nunjucks";
import path from "path";
import prompts from "prompts";
import { env, RenderedEnvironment, RequestDefinition } from "../../../core";
import { RenderedRequest } from "../../../core/insomniaTypes";
import { Network } from "../../../core/network";
import { State } from "../../../core/types";
// import { RequestDefinition } from "../core";
// import { RenderedRequest } from "../core/insomniaTypes";
// import { Network } from "../core/network";
// import { State } from "../core/types";
import { Command } from "../command";

const run = async (args: CommandLineOptions): Promise<void> => {
  if (!args.request) {
    console.log("a request name must be provided");
    process.exit(1);
  }

  const requestDefinition = await loadRequest(args.request);
  let envStr = args.env;
  if (!envStr) {
    const resEnvStr = await env.getActive();
    if (resEnvStr.isErr()) {
      console.error(`\nFailed to send request (error loading environment: ${resEnvStr.error})`);
      process.exit(1);
    }
    envStr = resEnvStr.value;
  }
  // get and issue environment prompts
  const resEnvPrompts = await env.getPrompts(envStr);
  if (resEnvPrompts.isErr()) {
    console.error(`\nFailed to send request (error loading environment: ${resEnvPrompts.error})`);
    process.exit(1);
  }
  const envPrompts = resEnvPrompts.value;
  console.log("res env prompts", envPrompts);

  const envPrivates = {};

  // prompt and private

  for (const envPrompt of envPrompts) {
    const response = await prompts({
      type: "password",
      name: "val",
      message: `${envPrompt.description} (${chalk.dim(envPrompt.key)})`,
      validate: (value) => (Boolean(value) ? true : `Cannot be empty`),
    });

    if (response.val === undefined) {
      process.exit(0);
    }

    console.log(response.val); // => { value: 24 }

    const op = _.set({}, envPrompt.key, response.val);
    _.merge(envPrivates, op);
  }

  console.log("SUPER SECRET DATA: ", envPrivates);

  const resLoadedEnv = await env.get(envStr, envPrivates);
  if (resLoadedEnv.isErr()) {
    console.error(`\nFailed to send request (error loading environment: ${resLoadedEnv.error})`);
    process.exit(1);
  }
  const loadedEnv = resLoadedEnv.value;

  console.log("LOADED ENV WITH SECRETS: ", loadedEnv);

  // // const env = await loadEnv(envStr);
  const state: State = {};
  const renderedRequest = await renderRequest(requestDefinition, loadedEnv, state);
  const requestResult = await issueRequest(renderedRequest);
  console.log("response status: ", requestResult);
};

export const RequestCommand: Command = {
  name: "request",
  options: [
    { name: "request", defaultOption: true },
    { name: "env", alias: "e" },
  ],
  run,
};

const issueRequest = (rendered: RenderedRequest): Promise<number> => Network.performRequest(rendered);

const loadRequest = async (request: string): Promise<RequestDefinition> => {
  const req = `${request}.json`;
  const requestPath = path.join(".owl", req);

  const requestContent = await readFile(requestPath, "utf-8");
  const requestFile = JSON.parse(requestContent) as RequestDefinition;

  return requestFile;
};

const renderRequest = async (
  definition: RequestDefinition,
  env: RenderedEnvironment,
  state: State
): Promise<RenderedRequest> => {
  const cloned: RequestDefinition = _.cloneDeep(definition);
  cloned.url = template(definition.url, env, state);
  // cloned.body = template(definition.body, env, state);

  return {
    ...cloned,
    cookies: [],
    cookieJar: {},
  };
};

const template = (content: string, env: RenderedEnvironment, state: State): string => {
  const context = buildContext(env, state);
  return nunjucks.renderString(content, context);
};

const buildContext = (env: RenderedEnvironment, state: State): any => {
  return {
    env,
    state,
  };
};
