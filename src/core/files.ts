import path from "path";

const rootDir = () => ".owl";

export const files = {
  rootDir,
  envDir: () => path.join(rootDir(), ".env"),
  envPath: (name: string) => path.join(rootDir(), ".env", `${name}.json`),
  envConfigPath: () => path.join(rootDir(), ".env", ".config"),
};
