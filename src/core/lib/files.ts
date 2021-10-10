import path from "path";

const rootDir = () => ".owl";

const validUserPaths = /^[^\.\\/:*?"<>|\cA-\cZ][^\\/:*?"<>|\cA-\cZ]*$/;

const validUserPathComponent = (str: string) => {
  return validUserPaths.test(str);
};

export const files = {
  rootDir,
  envDir: () => path.join(rootDir(), ".env"),
  envPath: (name: string) => path.join(rootDir(), ".env", `${name}.json`),
  envConfigPath: () => path.join(rootDir(), ".env", ".config"),

  isValidUserPathComponent: validUserPathComponent,
};


