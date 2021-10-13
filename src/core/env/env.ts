import _ from "lodash";
import { err, ok, Result } from "neverthrow";
import { files } from "../lib/files";
import { paths } from "../lib/paths";
import { isValidEnvironmentName } from "./envIsValidEnvironmentName";
import { listSummary, summaryFor } from "./envListSummary";
import { get } from "./envGet";

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

  // is this the first env? If so we should automatically make it the default
  const list = await listSummary();
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

const rename = async (oldEnv: string, newEnv: string): Promise<Result<undefined, string>> => {
  if (!(await exists(oldEnv))) {
    return err(`the environment does not exist: ${oldEnv}`);
  }

  if (await exists(newEnv)) {
    return err(`an environment already exists: ${newEnv}`);
  }

  const resDefault = await getDefault();
  if (resDefault.isErr()) {
    return err(resDefault.error);
  }
  const wasDefault = resDefault.value == oldEnv;

  const oldEnvPath = await paths.envPath(oldEnv);
  const newEnvPath = await paths.envPath(newEnv);

  const resFiles = await files.move(oldEnvPath, newEnvPath);
  if (resFiles.isErr()) {
    return err(resFiles.error);
  }

  if (wasDefault) {
    return setDefault(newEnv);
  }
  return ok(undefined);
};

const update = async (env: string, values: any, merge = false): Promise<Result<undefined, string>> => {
  console.log("starting update");
  if (!(await exists(env))) {
    return err(`the environment does not exist: ${env}`);
  }

  let base = {};
  if (merge) {
    const resCurrent = await get(env);
    if (resCurrent.isErr()) {
      return err(resCurrent.error);
    }
    base = resCurrent.value;
  }

  // todo: .assign doesn't do a deep merge the way we will probably want it to,
  // but .merge doesn't handle `undefined` values the way we want it to. This will
  // probably need to be replaced with a custom implementation.
  const updated = _.assign({}, base, values);

  const envPath = await paths.envPath(env);
  return files.writeJson(envPath, updated);
};

export const env = {
  listSummary,
  summaryFor,
  get,
  create,
  update,
  delete: del,
  rename,
  setDefault,
  getDefault,
  getActive,
  isValidEnvironmentName,
  exists,
};
