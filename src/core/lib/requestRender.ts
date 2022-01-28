import _ from "lodash";
import nunjucks from "nunjucks";
import { CookieJar } from "tough-cookie";
import { v4 as genuuid } from "uuid";
import { RenderedEnvironment, RequestDefinition } from "..";
import { RenderedRequest } from "../insomniaTypes";
import { State } from "../types";

const render = async (
  definition: RequestDefinition,
  env: RenderedEnvironment,
  state: State,
  prompts: Record<string, unknown> = {}
): Promise<RenderedRequest> => {
  const cloned: RequestDefinition = _.cloneDeep(definition);
  cloned.url = template(definition.url, env, state, prompts);
  if (cloned.body.text) {
    cloned.body.text = template(cloned.body.text, env, state, prompts);
  }

  cloned.headers = template(cloned.headers, env, state, prompts);
  cloned.authentication = template(cloned.authentication, env, state, prompts);

  if (!state.cookies.cookies) {
    state.cookies.cookies = [];
  }

  return {
    ...cloned,
    _id: genuuid(),
    cookies: [],
    cookieJar: CookieJar.fromJSON(JSON.stringify(state.cookies)),
  };
};

export const requestRender = {
  render,
};

const templateString = (
  content: string,
  env: RenderedEnvironment,
  state: State,
  prompts: Record<string, unknown>
): string => {
  const context = buildContext(env, state, prompts);
  const result = nunjucks.renderString(content, context);
  return result;
};

const templateObject = (
  obj: Record<string, unknown>,
  env: RenderedEnvironment,
  state: State,
  prompts: Record<string, unknown>
): Record<string, unknown> => {
  const keys = Object.keys(obj);
  for (const k of keys) {
    obj[k] = template(obj[k], env, state, prompts);
  }
  return obj;
};

const templateArray = (
  arr: unknown[],
  env: RenderedEnvironment,
  state: State,
  prompts: Record<string, unknown>
): unknown[] => {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = template(arr[i], env, state, prompts);
  }
  return arr;
};

const templateUnknown = (
  unk: unknown,
  env: RenderedEnvironment,
  state: State,
  prompts: Record<string, unknown>
): unknown => {
  if (Array.isArray(unk)) {
    return templateArray(unk, env, state, prompts);
  } else if (typeof unk == "string") {
    return templateString(unk as string, env, state, prompts);
  } else if (typeof unk == "object") {
    return templateObject(unk as Record<string, unknown>, env, state, prompts);
  }
  return unk;
};

const template = <T>(thing: T, env: RenderedEnvironment, state: State, prompts: Record<string, unknown>): T => {
  return templateUnknown(thing, env, state, prompts) as T;
};

const buildContext = (env: RenderedEnvironment, state: State, prompts: Record<string, unknown>): any => {
  return {
    env,
    state: state.value,
    prompts,
  };
};
