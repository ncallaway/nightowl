import { readFile } from "fs/promises";
import { err, ok, Result } from "neverthrow";
import path from "path";
import { Prompt, envLib as envLib } from "../env/env";
import { Network } from "../insomnia/network";
import type { RenderedRequest, RequestDefinition, ResponsePatch } from "../insomniaTypes";
import { requestRender } from "../lib/requestRender";
import { stateLib } from "../state/state";
import { dbstore } from "../store/dbstore";
import { OwlStore, UnknownObject } from "../types";

type RequestPrompts = {
  environment: Prompt[];
  request: Prompt[];
};

const getPrompts = async (request: string, env?: string): Promise<Result<RequestPrompts, string>> => {
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

  // load request and get prompts
  const resRequestDefinition = await loadRequest(request);
  if (resRequestDefinition.isErr()) {
    return err(resRequestDefinition.error);
  }
  const requestDefinition = resRequestDefinition.value;

  return ok({
    environment: envPrompts,
    request: requestDefinition.prompts,
  });
};

const runRequest = async (
  request: string,
  env: string | undefined,
  state: string | undefined,
  envPrompts: Record<string, unknown>,
  reqPrompts: Record<string, unknown>,
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
  const resLoadedEnv = await envLib.get(env, envPrompts);
  if (resLoadedEnv.isErr()) {
    return err(resLoadedEnv.error);
  }
  const loadedEnv = resLoadedEnv.value;

  const resRequestDefinition = await loadRequest(request);
  if (resRequestDefinition.isErr()) {
    return err(resRequestDefinition.error);
  }
  const requestDefinition = resRequestDefinition.value;

  const loadedStateRes = await stateLib.get(state, env, store);
  if (loadedStateRes.isErr()) {
    return err(loadedStateRes.error);
  }
  const loadedState = loadedStateRes.value;

  const renderedRequest = await requestRender.render(requestDefinition, loadedEnv, loadedState, reqPrompts);
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

const loadRequest = async (request: string): Promise<Result<RequestDefinition, string>> => {
  const req = `${request}.json`;
  const requestPath = path.join(".owl", req);

  const requestContent = await readFile(requestPath, "utf-8");
  const loaded = JSON.parse(requestContent) as Partial<RequestDefinition>;

  // validate required fields
  if (!loaded.url) {
    return err("the request didn't have a url defined");
  }

  const method = loaded.method ?? "get";
  const headers = loaded.headers ?? [];

  if (loaded.body?.json) {
    loaded.body.text = JSON.stringify(loaded.body.json);
    if (
      !headers.some((h) => {
        h.name.toLowerCase() == "content-type";
      })
    ) {
      headers.push({
        name: "Content-Type",
        value: "application/json",
      });
    }
  }

  const constructed: RequestDefinition = {
    _key: request,
    url: loaded.url,
    description: loaded.description ?? `${method} ${loaded.url}`,
    authentication: loaded.authentication ?? {},
    body: loaded.body || {},
    headers,
    isPrivate: loaded.isPrivate ?? false,
    metaSortKey: loaded.metaSortKey ?? 9,
    method,
    parameters: loaded.parameters ?? [],
    prompts: loaded.prompts ?? [],
    settingDisableRenderRequestBody: loaded.settingDisableRenderRequestBody ?? false,
    settingEncodeUrl: loaded.settingEncodeUrl ?? true,
    settingFollowRedirects: loaded.settingFollowRedirects ?? "global",
    settingRebuildPath: loaded.settingRebuildPath ?? true,
    settingSendCookies: loaded.settingSendCookies ?? true,
    settingStoreCookies: loaded.settingStoreCookies ?? true,
  };

  return ok(constructed);
};
