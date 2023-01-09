import fs from 'fs/promises';
import { err, ok, Result } from "neverthrow";
import { envLib, Prompt } from "../env/env";
import { OwlError } from "../errors";
import { Network } from "../insomnia/network";
import type { InternalRequestDefinition, RenderedRequest, ResponsePatch } from "../insomniaTypes";
import { files } from "../lib/files";
import { owlpaths } from "../lib/owlpaths";
import { requestRender } from "../lib/requestRender";
import { RequestDefinition, requestDefinitionSchema } from "../schemas/requestSchema";
import { SerializedRequestDefinition, serializedRequestDefinitionSchema } from "../schemas/serializedRequestSchema";
import { zodUtil } from "../schemas/zodUtil";
import { stateLib } from "../state/state";
import { dbstore } from "../store/dbstore";
import { OwlStore, UnknownObject } from "../types";
import { convert } from "./requestConvert";

type RequestPrompts = {
  environment: Prompt[];
  request: Prompt[];
};

const getPrompts = async (request: string, env?: string): Promise<Result<RequestPrompts, OwlError>> => {
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
): Promise<Result<ResponsePatch, OwlError>> => {
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

const exists = async (request: string): Promise<boolean> => {
  const path = owlpaths.requestPath(request);
  try {
    const stat = await fs.stat(path);
    return stat.isFile();
  } catch (err) {
    return false;
  }
}

const requestGroupExists = async (request: string): Promise<boolean> => {
  const path = owlpaths.requestGroupPath(request);
  try {
    const stat = await fs.stat(path);
    return stat.isDirectory();
  } catch (err) {
    return false;
  }
}

const create = async (request: string, definition: RequestDefinition): Promise<Result<undefined, OwlError>> => {
  // validate the serialized request
  const sresDefinition = requestDefinitionSchema.safeParse(definition);
  if (!sresDefinition.success) {
    return err({ error: "err-invalid-request-def", detail: zodUtil.joinErrors(sresDefinition.error)});
  }
  definition = sresDefinition.data;

  // ensure a request group doesn't already exist
  if (await requestGroupExists(request)) {
    return err({ error: 'err-request-group-already-exists', identifier: request });
  }

  const parentComponents = request.split("/").slice(0, -1);
  const parentPath = parentComponents.join("/");

  // first check that this is a valid request key
    // - all parents either don't exist or are already directories
  for (let idx = 0; idx < parentComponents.length; idx++) {
    const groupPath = parentComponents.slice(0, idx + 1).join("/");
    if (await exists(groupPath)) {
      return err({ error: 'err-request-def-already-exists', identifier: groupPath });
    }
  }

  // construct any necessary missing directories
  if (parentPath) {
    await fs.mkdir(owlpaths.requestGroupPath(parentPath), { recursive: true });
  }

  // write the json for the request
  const path = owlpaths.requestPath(request);
  const res = await files.writeJson(path, definition, { pretty: true, flag: "wx" });
  return res.mapErr(e => {
    if ((e as any).code == "EEXIST") {
      return {error: "err-request-def-already-exists", detail: e, identifier: request}
    }
    return {error: "err-writing-request-def", detail: e, identifier: path}
  });
}

const del = async (request: string): Promise<Result<undefined, OwlError>> => {
  if (!(await exists(request))) {
    return err({error: 'err-request-def-not-found', identifier: request});
  }

  const requestPath = await owlpaths.requestPath(request);

  return (await files.delete(requestPath)).mapErr(() => ({ error: "err-writing-request-def", identifier: requestPath}));
};


export const request = {
  convert,
  create,
  getPrompts,
  exists,
  delete: del,
  runRequest,
};

const issueRequest = (rendered: RenderedRequest): Promise<ResponsePatch> => Network.performRequest(rendered);

const loadRequest = async (request: string): Promise<Result<InternalRequestDefinition, OwlError>> => {
  const requestPath = owlpaths.requestPath(request);

  const resLoaded = await files.readJson<SerializedRequestDefinition>(requestPath, serializedRequestDefinitionSchema);
  if (resLoaded.isErr()) {
    return err({ ...resLoaded.error, error: 'err-reading-env', identifier: requestPath});
  }
  const loaded = resLoaded.value;

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

  const constructed: InternalRequestDefinition = {
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
