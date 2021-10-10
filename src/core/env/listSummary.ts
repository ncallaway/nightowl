import { readdir } from "fs/promises";
import { paths } from "../lib/files";
import { isValidEnvironmentName } from "./isValidEnvironmentName";

export type EnvironmentSummary = {
  name: string;
  warnings?: string[];
  errors?: string[];
};

export const listSummary = async (): Promise<EnvironmentSummary[]> => {
  const results = await readdir(paths.envDir(), { withFileTypes: true });

  const envNames = results
    .filter((dirent) => dirent.isFile())
    .filter((dirent) => dirent.name.endsWith(".json"))
    .map((dirent) => dirent.name.substring(0, dirent.name.length - 5))
    .filter((name) => isValidEnvironmentName(name))
    .sort((a, b) => a.localeCompare(b));

  return Promise.all(envNames.map(summaryFor));
};

export const summaryFor = async (env: string): Promise<EnvironmentSummary> => {
  return {
    name: env,
  };
};
