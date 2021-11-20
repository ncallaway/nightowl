import path from "path";
import envPaths from "env-paths";

const rootDir = (): string => ".owl";

const validUserPathCharsRegex = /^[^.\\/:*?"<>|\cA-\cZ][^\\/:*?"<>|\cA-\cZ]*$/;

const isValidUserPathComponent = (str: string): boolean => {
  const isTrimmed = str == str.trim();
  const isValidChars = validUserPathCharsRegex.test(str);
  return isTrimmed && isValidChars;
};

const globalPaths = envPaths("nightowl");
const globalDataDir = (): string => globalPaths.data;
const globalTempDir = (): string => globalPaths.temp;

export const owlpaths = {
  rootDir,
  envDir: (): string => path.join(rootDir(), ".env"),
  envPath: async (name: string): Promise<string> => path.join(rootDir(), ".env", `${name}.json`),
  envConfigPath: (): string => path.join(rootDir(), ".env", ".config"),

  globalDataDir,
  globalTempDir,

  isValidUserPathComponent,
};
