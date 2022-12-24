import _ from "lodash";
import { err, ok, Result } from "neverthrow";
import { OwlError } from "../errors";
import { envPrivates } from "../lib/envPrivates";
import { files } from "../lib/files";
import { owlpaths } from "../lib/owlpaths";
import { userstore } from "../lib/userstore";
import { UnknownObject } from "../types";
import { get, getPrivateKeys } from "./envGet";
import { isValidEnvironmentName } from "./envIsValidEnvironmentName";
import { listSummary, summaryFor } from "./envListSummary";

export type RenderedEnvironment = Record<string, unknown>;
export type EnvironmentPrivateDefinition = {
  key: string;
  description: string;
};
export type SavedEnvironment = {
  values: Record<string, unknown>;
  private: EnvironmentPrivateDefinition[];
};

export type Prompt = {
  key: string;
  description?: string;
};

const getPrompts = async (env: string): Promise<Result<Prompt[], OwlError>> => {
  const envPath = await owlpaths.envPath(env);

  const resEnvRaw = await files.readJson(envPath, undefined, {});
  if (resEnvRaw.isErr()) {
    return err({error: 'err-reading-env', detail: resEnvRaw.error.detail, identifier: envPath});
  }
  const envRaw = resEnvRaw.value as any;

  const privates = envRaw.private || [];

  const savedPrivateValues = await userstore.getEnvPrivateValues(env);

  const unsavedPrivates = privates.filter((p: any) => !Boolean(_.get(savedPrivateValues, p.key)));

  return ok(unsavedPrivates);
};

const setDefault = async (env: string): Promise<Result<undefined, OwlError>> => {
  if (!(await exists(env))) {
    return err({error: 'err-env-not-found'});
  }

  // read config file
  const resJson = await files.readJson(owlpaths.envConfigPath(), undefined, {});
  if (resJson.isErr()) {
    return err({ ...resJson.error, error: "err-reading-env-config"});
  }

  const config = resJson.value as any;
  config.default = env;

  // write to config...
  const resWrite = await files.writeJson(owlpaths.envConfigPath(), config);
  if (resWrite.isErr()) {
    return err({ error: "err-writing-env-config", detail: resWrite.error});
  }

  return ok(undefined);
};

const getDefault = async (): Promise<Result<string, OwlError>> => {
  // get the configured default
  const resConfig = await files.readJson(owlpaths.envConfigPath(), undefined, {});
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
  return err({error: 'err-no-default-env'});
};

const getActive = async (): Promise<Result<string, OwlError>> => {
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

const del = async (env: string): Promise<Result<undefined, OwlError>> => {
  if (!(await exists(env))) {
    return err({error: 'err-env-not-found', identifier: env});
  }

  const envPath = await owlpaths.envPath(env);

  // is default?
  // is last?

  return (await files.delete(envPath)).mapErr(() => ({ error: "err-writing-env", envPath}));
};

const rename = async (oldEnv: string, newEnv: string): Promise<Result<undefined, OwlError>> => {
  if (!(await exists(oldEnv))) {
    return err({error: 'err-env-not-found', identifier: oldEnv});
  }

  if (await exists(newEnv)) {
    return err({error: 'err-env-already-exists', identifier: newEnv});
  }

  const resDefault = await getDefault();
  if (resDefault.isErr()) {
    return err(resDefault.error);
  }
  const wasDefault = resDefault.value == oldEnv;

  const oldEnvPath = await owlpaths.envPath(oldEnv);
  const newEnvPath = await owlpaths.envPath(newEnv);

  const resFiles = await files.move(oldEnvPath, newEnvPath);
  if (resFiles.isErr()) {
    return err({error: 'err-writing-env', detail: resFiles.error, identifier: newEnvPath});
  }

  if (wasDefault) {
    return setDefault(newEnv);
  }
  return ok(undefined);
};

const create = async (env: string): Promise<Result<undefined, OwlError>> => {
  if (!isValidEnvironmentName(env)) {
    return err({ error: "err-invalid-env-name", identifier: env});
  }

  if (await exists(env)) {
    return err({error: 'err-env-already-exists', identifier: env});
  }

  // is this the first env? If so we should automatically make it the default
  const list = await listSummary();
  const noEnviroments = list.length == 0;

  const envPath = await owlpaths.envPath(env);

  const writeRes = await files.writeJson(envPath, {});
  if (writeRes.isErr()) {
    return err({error: 'err-writing-env', detail: writeRes.error, identifier: envPath});
  }

  if (noEnviroments) {
    return await setDefault(env);
  }

  return ok(undefined);
};

const update = async (
  env: string,
  values: UnknownObject,
  privates: UnknownObject,
  merge = false
): Promise<Result<undefined, OwlError>> => {
  if (!(await exists(env))) {
    return err({error: 'err-env-not-found', identifier: env});
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
    const envPath = await owlpaths.envPath(env);
    const resEnvRaw = await files.readJson(envPath, undefined, {});
    if (resEnvRaw.isErr()) {
      return err({ ...resEnvRaw.error, error: 'err-reading-env', identifier: envPath});
    }
    base = resEnvRaw.value as SavedEnvironment;
    privateDefinitions = base.private;
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

  const envPath = owlpaths.envPath(env);
  const resWrite = await files.writeJson(envPath, updated, { pretty: true });
  return resWrite.mapErr(error => ({ error: "err-writing-env", detail: error, identifier: envPath }));
};

const envOrDefault = async (env: string | undefined): Promise<Result<string, OwlError>> => {
  if (env) {
    return ok(env);
  }

  const resEnvStr = await envLib.getActive();
  if (resEnvStr.isErr()) {
    return err(resEnvStr.error);
  }
  return ok(resEnvStr.value);
};

export const envLib = {
  listSummary,
  summaryFor,
  getPrompts,
  get,
  getPrivateKeys,
  create,
  update,
  delete: del,
  rename,
  setDefault,
  getDefault,
  getActive,
  isValidEnvironmentName,
  exists,
  envOrDefault,
};
