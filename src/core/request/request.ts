import { readFile } from "fs/promises";
import { err, ok, Result } from "neverthrow";
import path from "path";
import { EnvironmentPrompt, envLib as envLib } from "../env/env";
import { Network } from "../insomnia/network";
import type { RenderedRequest, RequestDefinition, ResponsePatch } from "../insomniaTypes";
import { requestRender } from "../lib/requestRender";
import { stateLib } from "../state/state";
import { dbstore } from "../store/dbstore";
import { OwlStore, UnknownObject } from "../types";

const getPrompts = async (request: string, env?: string): Promise<Result<EnvironmentPrompt[], string>> => {
  const resEnv = await envLib.envOrDefault(env);
  if (resEnv.isErr()) {
    return err(resEnv.error);
  }
  env = resEnv.value;

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
  env: string | undefined,
  state: string | undefined,
  prompts: Record<string, unknown>,
  store: OwlStore
): Promise<Result<ResponsePatch, string>> => {
  const resState = stateLib.stateOrDefault(state);
  if (resState.isErr()) {
    return err(resState.error);
  }
  state = resState.value;

  const resEnv = await envLib.envOrDefault(env);
  if (resEnv.isErr()) {
    return err(resEnv.error);
  }
  env = resEnv.value;
  const resLoadedEnv = await envLib.get(env, prompts);
  if (resLoadedEnv.isErr()) {
    return err(resLoadedEnv.error);
  }
  const loadedEnv = resLoadedEnv.value;

  const requestDefinition = await loadRequest(request);

  const loadedStateRes = await stateLib.get(state, env, store);
  if (loadedStateRes.isErr()) {
    return err(loadedStateRes.error);
  }
  const loadedState = loadedStateRes.value;

  const renderedRequest = await requestRender.render(requestDefinition, loadedEnv, loadedState);
  const requestResult = await issueRequest(renderedRequest);

  // save the response, and the cookie store
  await dbstore.saveResponse(store.db, requestResult);

  if (renderedRequest.settingStoreCookies) {
    loadedState.cookies = renderedRequest.cookieJar.toJSON() as unknown as UnknownObject;
    await dbstore.saveState(store.db, loadedState);
  }

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

  if (!requestFile.body) {
    requestFile.body = {};
  }

  if (!requestFile.headers) {
    requestFile.headers = [];
  }

  if (!requestFile.authentication) {
    requestFile.authentication = {};
  }

  if (!requestFile.parameters) {
    requestFile.parameters = [];
  }

  // @ts-expect-error we need an alternative TS type for the file we load, than the rendered definition
  if (requestFile.body.json) {
    // @ts-expect-error we need an alternative TS type for the file we load, than the rendered definition
    requestFile.body.text = JSON.stringify(requestFile.body.json);
    if (
      !requestFile.headers.some((h) => {
        h.name.toLowerCase() == "content-type";
      })
    ) {
      requestFile.headers.push({
        name: "Content-Type",
        value: "application/json",
      });
    }
  }

  return requestFile;
};
