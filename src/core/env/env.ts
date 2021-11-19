import _ from "lodash";
import { err, ok, Result } from "neverthrow";
import { files } from "../lib/files";
import { paths } from "../lib/paths";
import { isValidEnvironmentName } from "./envIsValidEnvironmentName";
import { listSummary, summaryFor } from "./envListSummary";
import { get } from "./envGet";
import { userstore } from "../lib/userstore";
import { envPrivates } from "../lib/envPrivates";

export type RenderedEnvironment = Record<string, unknown>;
export type EnvironmentPrivateDefinition = {
  key: string;
  description: string;
};
export type SavedEnvironment = {
  values: Record<string, unknown>;
  private: EnvironmentPrivateDefinition[];
};

export type EnvironmentPrompt = {
  key: string;
  description: string;
};

const getPrompts = async (env: string): Promise<Result<EnvironmentPrompt[], string>> => {
  const envPath = await paths.envPath(env);

  const resEnvRaw = await files.readJson(envPath);
  if (resEnvRaw.isErr()) {
    return err(resEnvRaw.error);
  }
  const envRaw = resEnvRaw.value as any;

  const privates = envRaw.private || [];

  const savedPrivateValues = await userstore.getEnvPrivateValues(env);

  const unsavedPrivates = privates.filter((p: any) => !Boolean(_.get(savedPrivateValues, p.key)));

  return ok(unsavedPrivates);
};

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

  const config = resJson.value as any;
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
    const config = resConfig.value as any;
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

const update = async (env: string, values: any, privates: any, merge = false): Promise<Result<undefined, string>> => {
  if (!(await exists(env))) {
    return err(`the environment does not exist: ${env}`);
  }

  // let baseValues = {};
  // let basePrivates: SerializedEnvironmentPrivate = [];
  let privateDefinitions: EnvironmentPrivateDefinition[] = [];
  let savedPrivateValues = {};
  let base: SavedEnvironment = {
    values: {},
    private: [],
  };

  if (merge) {
    const envPath = await paths.envPath(env);
    const resEnvRaw = await files.readJson(envPath);
    if (resEnvRaw.isErr()) {
      return err(resEnvRaw.error);
    }
    base = resEnvRaw.value as SavedEnvironment;
    privateDefinitions = base.private;
    console.log("got base: ", base);
    savedPrivateValues = await userstore.getEnvPrivateValues(env);
  }

  // todo: .assign doesn't do a deep merge the way we will probably want it to,
  // but .merge doesn't handle `undefined` values the way we want it to. This will
  // probably need to be replaced with a custom implementation.
  const updatedValues = _.assign({}, base.values, values);
  savedPrivateValues = _.assign({}, savedPrivateValues, privates);

  // calculate the new private keys
  const newPrivateKeys = envPrivates.allKeysForPrivates(privates);
  const newPrivateDefinitions: EnvironmentPrivateDefinition[] = newPrivateKeys.map((k) => {
    return {
      key: k,
      description: "",
    };
  });

  const allPrivateDefinitions: EnvironmentPrivateDefinition[] = [...privateDefinitions];
  for (const def of newPrivateDefinitions) {
    if (!allPrivateDefinitions.find((d) => d.key == def.key)) {
      allPrivateDefinitions.push(def);
    }
  }

  const updated: SavedEnvironment = {
    values: updatedValues,
    private: allPrivateDefinitions,
  };

  await userstore.saveEnvPrivateValues(env, savedPrivateValues);

  const envPath = await paths.envPath(env);
  return files.writeJson(envPath, updated, { pretty: true });
};

export const env = {
  listSummary,
  summaryFor,
  getPrompts,
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
