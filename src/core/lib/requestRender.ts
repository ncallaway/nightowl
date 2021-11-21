import { RenderedEnvironment, RequestDefinition } from "..";
import { RenderedRequest } from "../insomniaTypes";
import { State } from "../types";
import nunjucks from "nunjucks";
import _ from "lodash";
import { v4 as genuuid } from "uuid";

const render = async (
  definition: RequestDefinition,
  env: RenderedEnvironment,
  state: State
): Promise<RenderedRequest> => {
  const cloned: RequestDefinition = _.cloneDeep(definition);
  cloned.url = template(definition.url, env, state);
  if (cloned.body.text) {
    cloned.body.text = template(cloned.body.text, env, state);
  }

  cloned.headers = template(cloned.headers, env, state);
  cloned.authentication = template(cloned.authentication, env, state);

  return {
    ...cloned,
    _id: genuuid(),
    cookies: [],
    cookieJar: {},
  };
};

export const requestRender = {
  render,
};

const templateString = (content: string, env: RenderedEnvironment, state: State): string => {
  const context = buildContext(env, state);
  return nunjucks.renderString(content, context);
};

const templateObject = (
  obj: Record<string, unknown>,
  env: RenderedEnvironment,
  state: State
): Record<string, unknown> => {
  const keys = Object.keys(obj);
  for (const k of keys) {
    obj[k] = template(obj[k], env, state);
  }
  return obj;
};

const templateArray = (arr: unknown[], env: RenderedEnvironment, state: State): unknown[] => {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = template(arr[i], env, state);
  }
  return arr;
};

const templateUnknown = (unk: unknown, env: RenderedEnvironment, state: State): unknown => {
  if (Array.isArray(unk)) {
    return templateArray(unk, env, state);
  } else if (typeof unk == "string") {
    return templateString(unk as string, env, state);
  } else if (typeof unk == "object") {
    return templateObject(unk as Record<string, unknown>, env, state);
  }
  return unk;
};

const template = <T>(thing: T, env: RenderedEnvironment, state: State): T => {
  return templateUnknown(thing, env, state) as T;
};

const buildContext = (env: RenderedEnvironment, state: State): any => {
  return {
    env,
    state,
  };
};
