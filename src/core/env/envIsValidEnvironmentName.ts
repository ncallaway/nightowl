import { owlpaths } from "../lib/owlpaths";

export const isValidEnvironmentName = (env: string): boolean => {
  return owlpaths.isValidUserPathComponent(env);
};
