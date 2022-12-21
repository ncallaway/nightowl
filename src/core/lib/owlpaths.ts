import path from "path";
import envPaths from "env-paths";

const workspaceDir = (): string => ".owl";

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
  workspaceDir,
  globalDataDir,
  globalTempDir,

  workspaceConfigPath: (): string => path.join(workspaceDir(), ".config"),

  envDir: (): string => path.join(workspaceDir(), ".env"),
  envPath: (name: string): string => path.join(workspaceDir(), ".env", `${name}.json`),
  envConfigPath: (): string => path.join(workspaceDir(), ".env", ".config"),

  databasePath: (key: string): string => path.join(globalDataDir(), `${key}-store.db`),

  isValidUserPathComponent,
};
