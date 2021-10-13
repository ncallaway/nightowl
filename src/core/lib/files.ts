import { rename, unlink, writeFile, readFile } from "fs/promises";
import { ok, err, Result } from "neverthrow";

const readTextFile = async (path: string): Promise<Result<string, string>> => {
  try {
    const rawContent = await readFile(path, "utf-8");
    return ok(rawContent);
  } catch (error) {
    return err("" + error);
  }
};
const readJson = async (path: string): Promise<Result<any, string>> => {
  const resRawFile = await readTextFile(path);

  return resRawFile.andThen((content) => {
    if (!content) {
      return ok({} as any);
    }

    try {
      const config: any = JSON.parse(content);
      return ok(config);
    } catch (error) {
      return err("" + error);
    }
  });
};

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const writeJson = async (path: string, json: any): Promise<Result<undefined, string>> => {
  let text = "";
  try {
    text = JSON.stringify(json);
  } catch (error) {
    return err("" + error);
  }

  try {
    await writeFile(path, text, "utf-8");
  } catch (error) {
    return err("" + error);
  }

  return ok(undefined);
};
/* eslint-enable @typescript-eslint/explicit-module-boundary-types */

const del = async (path: string): Promise<Result<undefined, string>> => {
  try {
    await unlink(path);
  } catch (error) {
    return err("" + error);
  }

  return ok(undefined);
};

const move = async (oldPath: string, newPath: string): Promise<Result<undefined, string>> => {
  try {
    await rename(oldPath, newPath);
  } catch (error) {
    return err("" + error);
  }

  return ok(undefined);
};

export const files = {
  readJson,
  writeJson,
  delete: del,
  move,
};
