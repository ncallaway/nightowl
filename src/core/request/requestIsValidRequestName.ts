import { owlpaths } from "../lib/owlpaths";

export const isValidRequestName = (request: string): boolean => {
  const components = request.split("/");
  return components.every(c => owlpaths.isValidUserPathComponent(c));
};
