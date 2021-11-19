import _ from "lodash";
import { err, ok, Result } from "neverthrow";
import { EnvironmentPrivateDefinition, RenderedEnvironment } from "..";
import { files } from "../lib/files";
import { paths } from "../lib/paths";
import { userstore } from "../lib/userstore";
import { SavedEnvironment } from "./env";

export const get = async (env: string, prompts: any = {}): Promise<Result<RenderedEnvironment, string>> => {
  const envPath = await paths.envPath(env);

  const resEnvRaw = await files.readJson(envPath);
  if (resEnvRaw.isErr()) {
    return err(resEnvRaw.error);
  }
  const envRaw = resEnvRaw.value as any;

  const savedEnv: SavedEnvironment = {
    values: envRaw.values || {},
    private: envRaw.private || [],
  };

  // fetch privates
  const savedPrivateValues = await userstore.getEnvPrivateValues(env);

  // render the environment
  const renderedPrivates = {};
  for (const privateDesc of savedEnv.private) {
    if (privateDesc.key) {
      const val = _.get(prompts, privateDesc.key) || _.get(savedPrivateValues, privateDesc.key) || undefined;
      _.set(renderedPrivates, privateDesc.key, val);
    }
  }

  await userstore.saveEnvPrivateValues(env, renderedPrivates);

  const renderedEnv: RenderedEnvironment = _.assign({}, savedEnv.values, renderedPrivates);
  return ok(renderedEnv);
};

export const getPrivateKeys = async (env: string): Promise<Result<EnvironmentPrivateDefinition[], string>> => {
  const envPath = await paths.envPath(env);

  const resEnvRaw = await files.readJson(envPath);
  if (resEnvRaw.isErr()) {
    return err(resEnvRaw.error);
  }
  const envRaw = resEnvRaw.value as SavedEnvironment;
  return ok(envRaw.private);
};