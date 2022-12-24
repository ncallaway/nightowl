import { OpenMode } from "fs";
import { readFile, rename, unlink, writeFile } from "fs/promises";
import { err, ok, Result } from "neverthrow";
import z from 'zod';
import { InternalError } from "../errors";
import { zodUtil } from "../schemas/zodUtil";

const readTextFile = async (path: string): Promise<Result<string, InternalError>> => {
  try {
    const rawContent = await readFile(path, "utf-8");
    return ok(rawContent);
  } catch (error) {
    return err({error: 'file-not-found', detail: error as Error, identifier: path});
  }
};
const readJson = async <T = unknown,>(path: string, schema?: z.ZodType<T>, def?: T): Promise<Result<T, InternalError>> => {
  const resRawFile = await readTextFile(path);

  return resRawFile.andThen((content) => {
    content = content?.trim();
    if (!content && def !== undefined) {
      return ok(def);
    } else if (!content) {
      return err({error: 'file-empty', identifier: path});
    }

    let parsed: any = undefined;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      return err({error: 'json-parse-error', detail: error as Error, identifier: path});
    }

    if (schema) {
      const validated = schema.safeParse(parsed);
      if (validated.success) {
        return ok(validated.data);
      } else {
        return err({error: 'schema-validation-error', detail: zodUtil.joinErrors(validated.error), identifier: path});
      }
    } else {
      return ok(parsed);
    }
  });
};

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
type JsonOptions = {
  pretty?: boolean;
  flag?: OpenMode;
};
const writeJson = async (path: string, json: any, options: JsonOptions = {}): Promise<Result<undefined, Error>> => {
  let text = "";
  try {
    if (options.pretty) {
      text = JSON.stringify(json, null, 2);
    } else {
      text = JSON.stringify(json);
    }

  } catch (error) {
    return err(error as Error);
  }

  try {
    await writeFile(path, text, { encoding: "utf-8", flag: options.flag});
  } catch (error) {
    return err(error as Error);
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

const move = async (oldPath: string, newPath: string): Promise<Result<undefined, Error>> => {
  try {
    await rename(oldPath, newPath);
  } catch (error) {
    return err(error as Error);
  }

  return ok(undefined);
};

export const files = {
  readJson,
  writeJson,
  delete: del,
  move,
};
