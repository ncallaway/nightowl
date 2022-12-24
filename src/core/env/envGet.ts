import _ from "lodash";
import { err, ok, Result } from "neverthrow";
import { EnvironmentPrivateDefinition, RenderedEnvironment } from "..";
import { OwlError } from "../errors";
import { files } from "../lib/files";
import { owlpaths } from "../lib/owlpaths";
import { userstore } from "../lib/userstore";
import { SavedEnvironment } from "./env";

export const get = async (env: string, prompts: any = {}): Promise<Result<RenderedEnvironment, OwlError>> => {
  const envPath = await owlpaths.envPath(env);

  const resEnvRaw = (await files.readJson(envPath, undefined, {}));
  if (resEnvRaw.isErr()) {
    const error = resEnvRaw.error;
    return err({error: error.error == "file-not-found" ? 'err-env-not-found' : 'err-reading-env', detail: error.detail, identifier: error.identifier} as OwlError)
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
  const envPath = await owlpaths.envPath(env);

  const resEnvRaw = await files.readJson(envPath, undefined, {});
  if (resEnvRaw.isErr()) {
    return err("" + resEnvRaw.error.detail);
  }
  const envRaw = resEnvRaw.value as SavedEnvironment;
  return ok(envRaw.private);
};