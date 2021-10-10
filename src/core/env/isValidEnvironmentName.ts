import { paths } from "../lib/files";

export const isValidEnvironmentName = (env: string): boolean => {
  return paths.isValidUserPathComponent(env);
};
