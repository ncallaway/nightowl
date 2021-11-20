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
