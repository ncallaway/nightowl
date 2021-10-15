import { readFile } from "fs/promises";
import _ from "lodash";
import nunjucks from "nunjucks";
import path from "path";
import { argv } from "process";
// import { RequestDefinition } from "../core";
// import { RenderedRequest } from "../core/insomniaTypes";
// import { Network } from "../core/network";
// import { State } from "../core/types";
import { Command } from "../command";
import { CommandLineOptions } from "command-line-args";
import { RenderedRequest } from "../../../core/insomniaTypes";
import { env, Environment, RequestDefinition } from "../../../core";
import { Network } from "../../../core/network";
import { State } from "../../../core/types";
import { err } from "neverthrow";

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
  const resLoadedEnv = await env.get(envStr);

  if (resLoadedEnv.isErr()) {
    console.error(`\nFailed to send request (error loading environment: ${resLoadedEnv.error})`);
    process.exit(1);
  }
  const loadedEnv = resLoadedEnv.value;

  // const env = await loadEnv(envStr);
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
  env: Environment,
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

const template = (content: string, env: Environment, state: State): string => {
  const context = buildContext(env, state);
  return nunjucks.renderString(content, context);
};

const buildContext = (env: Environment, state: State): any => {
  return {
    env,
    state,
  };
};
