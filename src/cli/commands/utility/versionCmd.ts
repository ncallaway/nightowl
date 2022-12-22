import { Command } from "../command";

import { version } from '../../../../package.json';

const printVersion = async (): Promise<void> => {
  console.log(`\nnightowl version ${version}`);
}

export const VersionCommand: Command = {
  name: "version",
  run: printVersion
}