import { readFile } from "fs/promises";
import _ from "lodash";
import nunjucks from "nunjucks";
import path from "path";
import { argv } from "process";
import { RequestDefinition } from "../core";
import { RenderedRequest } from "../core/insomniaTypes";
import { Network } from "../core/network";
import { State } from "../core/types";

import commandLineArgs from "command-line-args";
import { Commands } from "./commands/command";

export const main = async (): Promise<void> => {
  if (argv.length <= 2) {
    console.log("need at least 1 argument");
    process.exit(1);
  }

  let args = argv.slice(2);
  /* first - parse the main command name */

  let cmd = Commands.RootCommand;
  const mainDefinitions = [{ name: "cmd", defaultOption: true }];

  while (cmd.subcommands) {
    const cmdArgs = commandLineArgs(mainDefinitions, { argv: args, stopAtFirstUnknown: true });
    args = cmdArgs._unknown || [];

    const child = Commands.getChildCommand(cmd, cmdArgs.cmd);

    if (child) {
      cmd = child;
    } else {
      break;
    }
  }

  // do a final cli processing for the command

  if (cmd.run) {
    let cmdArgs = {};
    if (cmd.options) {
      cmdArgs = commandLineArgs(cmd.options, { argv: args, stopAtFirstUnknown: true });
    }
    cmd.run(cmdArgs);
  } else {
    console.log("(no-run for cmd) ", cmd);
  }

  // const remaining = argv.slice(2);
  // if (remaining.length == 0) {
  //   console.log("usage instructions?");
  //   process.exit(1);
  // }
  // const requestKey = remaining.shift() as string;
  // console.log("request is: ", requestKey);
  // const requestDefinition = await loadRequest(requestKey);
  // let envStr = "local";
  // if (remaining.length) {
  //   envStr = remaining.shift() as string;
  // }
  // const env = await loadEnv(envStr);
  // const state: State = {};
  // const renderedRequest = await renderRequest(requestDefinition, env, state);
  // const requestResult = await issueRequest(renderedRequest);
  // console.log("response status: ", requestResult);
};

/* eslint-disable @typescript-eslint/no-unused-vars */
const issueRequest = (rendered: RenderedRequest): Promise<number> => Network.performRequest(rendered);

const loadRequest = async (request: string): Promise<RequestDefinition> => {
  const req = `${request}.json`;
  const requestPath = path.join(".owl", req);

  const requestContent = await readFile(requestPath, "utf-8");
  const requestFile = JSON.parse(requestContent) as RequestDefinition;

  return requestFile;
};

type Environment = any;
const loadEnv = async (env: string): Promise<Environment> => {
  const envPath = path.join(".owl", ".env", `${env}.json`);

  const envContent = await readFile(envPath, "utf-8");
  const envFile = JSON.parse(envContent) || ({} as Environment);

  return envFile;
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
/* eslint-enable @typescript-eslint/no-unused-vars */

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
