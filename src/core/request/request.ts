// do a thing
import { readFile } from "fs/promises";
import { env as envLib, EnvironmentPrompt } from "../env/env";
import type { RenderedRequest, RequestDefinition, ResponsePatch } from "../insomniaTypes";
import path from "path";
import { err, ok, Result } from "neverthrow";
import { OwlStore, State } from "../types";
import { requestRender } from "../lib/requestRender";
import { Network } from "../insomnia/network";
import { dbstore } from "../store/dbstore";

const getPrompts = async (request: string, env?: string): Promise<Result<EnvironmentPrompt[], string>> => {
  if (!env) {
    const resEnvStr = await envLib.getActive();
    if (resEnvStr.isErr()) {
      return err(resEnvStr.error);
    }
    env = resEnvStr.value;
  }

  // get environment prompts
  const resEnvPrompts = await envLib.getPrompts(env);
  if (resEnvPrompts.isErr()) {
    return err(resEnvPrompts.error);
  }
  const envPrompts = resEnvPrompts.value;

  return ok(envPrompts);
};

const runRequest = async (
  request: string,
  env: string,
  prompts: Record<string, unknown>,
  store: OwlStore
): Promise<Result<ResponsePatch, string>> => {
  if (!env) {
    const resEnvStr = await envLib.getActive();
    if (resEnvStr.isErr()) {
      return err(resEnvStr.error);
    }
    env = resEnvStr.value;
  }

  const resLoadedEnv = await envLib.get(env, prompts);
  if (resLoadedEnv.isErr()) {
    return err(resLoadedEnv.error);
  }
  const loadedEnv = resLoadedEnv.value;

  const requestDefinition = await loadRequest(request);

  const state: State = {};
  const renderedRequest = await requestRender.render(requestDefinition, loadedEnv, state);
  const requestResult = await issueRequest(renderedRequest);

  await dbstore.saveResponse(store.db, requestResult);

  return ok(requestResult);
};

export const request = {
  getPrompts,
  runRequest,
};

const issueRequest = (rendered: RenderedRequest): Promise<ResponsePatch> => Network.performRequest(rendered);

const loadRequest = async (request: string): Promise<RequestDefinition> => {
  const req = `${request}.json`;
  const requestPath = path.join(".owl", req);

  const requestContent = await readFile(requestPath, "utf-8");
  const requestFile = JSON.parse(requestContent) as RequestDefinition;
  requestFile._key = request;

  return requestFile;
};
