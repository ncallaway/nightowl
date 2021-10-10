import { readFile, writeFile } from "fs/promises";
import { ok, err, Result } from "neverthrow";
import path from "path";

const rootDir = () => ".owl";

const validUserPathCharsRegex = /^[^\.\\/:\*\?"<>|\cA-\cZ][^\\/:\*\?"<>|\cA-\cZ]*$/;

const isValidUserPathComponent = (str: string) => {
  const isTrimmed = str == str.trim();
  const isValidChars = validUserPathCharsRegex.test(str);
  return isTrimmed && isValidChars;
};

export const paths = {
  rootDir,
  envDir: () => path.join(rootDir(), ".env"),
  envPath: (name: string) => path.join(rootDir(), ".env", `${name}.json`),
  envConfigPath: () => path.join(rootDir(), ".env", ".config"),

  isValidUserPathComponent,
};

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
      let config: any = JSON.parse(content);
      return ok(config);
    } catch (error) {
      return err("" + error);
    }
  });
};

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

export const files = {
  readJson,
  writeJson,
};
