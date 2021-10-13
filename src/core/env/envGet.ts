import { Result } from "neverthrow";
import { files } from "../lib/files";
import { paths } from "../lib/paths";

export const get = async (env: string): Promise<Result<any, string>> => {
  const envPath = await paths.envPath(env);
  return files.readJson(envPath);
};
