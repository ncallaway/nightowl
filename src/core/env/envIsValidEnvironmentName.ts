import { paths } from "../lib/paths";

export const isValidEnvironmentName = (env: string): boolean => {
  return paths.isValidUserPathComponent(env);
};
