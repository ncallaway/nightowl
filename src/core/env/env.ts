import { existsSync } from "fs";
import { readdir, readFile } from "fs/promises";
import { err, ok, Result } from "neverthrow";
import { files } from "../lib/files";

export type EnvironmentSummary = {
  name: string;
  warnings?: string[];
  errors?: string[];
};

const listSummary = async (): Promise<EnvironmentSummary[]> => {
  const results = await readdir(files.envDir(), { withFileTypes: true });

  const envNames = results
    .filter((dirent) => dirent.isFile())
    .filter((dirent) => dirent.name.endsWith(".json"))
    .map((dirent) => dirent.name.substring(0, dirent.name.length - 5))
    .sort((a, b) => a.localeCompare(b));

  return Promise.all(envNames.map(summaryFor));
};

const summaryFor = async (env: string): Promise<EnvironmentSummary> => {
  return {
    name: env,
  };
};

const defaultEnvironment = async (): Promise<Result<string, string>> => {
  // get the configured default
  try {
    const config = await readFile(files.envConfigPath(), "utf-8");
    const configResult = JSON.parse(config);
    if (configResult.default && (await environmentExists(configResult.default))) {
      return ok(configResult.default);
    }
  } catch (err) {}

  // get the fallback default
  const envs = await listSummary();

  if (envs.length) {
    return ok(envs[0].name);
  }

  // no default is available
  return err("No default environment exists");
};

const activeEnvironment = async (): Promise<Result<string, string>> => {
  if (process.env.OWL_ENV && (await environmentExists(process.env.OWL_ENV))) {
    return ok(process.env.OWL_ENV);
  }

  return defaultEnvironment();
};

const environmentExists = async (env: string): Promise<boolean> => {
  if (!isValidEnvironmentName(env)) {
    return false;
  }

  if (existsSync(files.envPath(env))) {
    return true;
  }

  return false;
};

const isValidEnvironmentName = (env: string): boolean => {
  return files.isValidUserPathComponent(env);
};

export const env = {
  listSummary,
  summaryFor,
  defaultEnvironment,
  activeEnvironment,
  environmentExists,
};
