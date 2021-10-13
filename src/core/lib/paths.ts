import path from "path";

const rootDir = (): string => ".owl";

const validUserPathCharsRegex = /^[^.\\/:*?"<>|\cA-\cZ][^\\/:*?"<>|\cA-\cZ]*$/;

const isValidUserPathComponent = (str: string): boolean => {
  const isTrimmed = str == str.trim();
  const isValidChars = validUserPathCharsRegex.test(str);
  return isTrimmed && isValidChars;
};

export const paths = {
  rootDir,
  envDir: (): string => path.join(rootDir(), ".env"),
  envPath: async (name: string): Promise<string> => path.join(rootDir(), ".env", `${name}.json`),
  envConfigPath: (): string => path.join(rootDir(), ".env", ".config"),

  isValidUserPathComponent,
};
