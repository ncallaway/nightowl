import { err, ok, Result } from "neverthrow";
import { files, paths } from "../lib/files";
import { isValidEnvironmentName } from "./isValidEnvironmentName";
import { listSummary, summaryFor } from "./listSummary";

const setDefault = async (env: string): Promise<Result<undefined, string>> => {
  if (!(await exists(env))) {
    // write to config...
    return err("The provided environment doesn't exist");
  }

  // read config file
  const resJson = await files.readJson(paths.envConfigPath());

  if (resJson.isErr()) {
    return err(resJson.error);
  }

  const config = resJson.value;
  config.default = env;

  const resWrite = await files.writeJson(paths.envConfigPath(), config);
  if (resWrite.isErr()) {
    return err(resWrite.error);
  }

  return ok(undefined);
};

const get = async (env: string): Promise<Result<any, string>> => {
  const envPath = await paths.envPath(env);
  return files.readJson(envPath);
};

const getDefault = async (): Promise<Result<string, string>> => {
  // get the configured default
  const resConfig = await files.readJson(paths.envConfigPath());
  if (resConfig.isOk()) {
    const config = resConfig.value;
    if (config.default && (await exists(config.default))) {
      return ok(config.default);
    }
  }

  // get the fallback default
  const envs = await listSummary();

  if (envs.length) {
    return ok(envs[0].name);
  }

  // no default is available
  return err("No default environment exists");
};

const getActive = async (): Promise<Result<string, string>> => {
  if (process.env.OWL_ENV && (await exists(process.env.OWL_ENV))) {
    return ok(process.env.OWL_ENV);
  }

  return getDefault();
};

const exists = async (env: string): Promise<boolean> => {
  if (!isValidEnvironmentName(env)) {
    return false;
  }

  const all = await listSummary();

  return Boolean(all.find((e) => e.name.toLowerCase() == env.toLowerCase()));
};

const create = async (env: string): Promise<Result<undefined, string>> => {
  if (!isValidEnvironmentName(env)) {
    return err(`the environment name was not valid: ${env}`);
  }

  if (await exists(env)) {
    return err(`the environment already exists: ${env}`);
  }

  // is first? make default?
  const list = await listSummary();
  // if (resList.isErr()) {
  //   return err(resList.error);
  // }

  const noEnviroments = list.length == 0;

  const envPath = await paths.envPath(env);

  const writeRes = await files.writeJson(envPath, {});

  if (writeRes.isErr()) {
    return err(writeRes.error);
  }

  if (noEnviroments) {
    return await setDefault(env);
  }

  return ok(undefined);
};

const del = async (env: string): Promise<Result<undefined, string>> => {
  if (!(await exists(env))) {
    return err(`the environment does not exist: ${env}`);
  }

  const envPath = await paths.envPath(env);

  // is default?
  // is last?

  return files.delete(envPath);
};

export const env = {
  listSummary,
  summaryFor,
  get,
  create,
  delete: del,
  setDefault,
  getDefault,
  getActive,
  isValidEnvironmentName,
  exists,
};
