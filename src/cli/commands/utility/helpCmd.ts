import { CommandLineOptions } from "command-line-args";
import path from "path";
import fs from "fs";
import { OwlErrorKey } from "../../../core/errors";
import { Errors } from "../../lib/errors";
import { Command } from "../command";

const run = async (args: CommandLineOptions): Promise<void> => {
  console.log();

  const cmd = args._unknown?.shift();
  if (cmd && Errors[cmd as OwlErrorKey]) {
    printErrorHelp(cmd as OwlErrorKey);
    return;
  }

  printHelp();
}

const printErrorHelp = (key: OwlErrorKey) => {
  printHelpFile(key, () => { console.log(`No help file exists for ${key}.`) })
}

export const hasHelpFile = (file: string): boolean => {
  const helpPath = path.join(__dirname, "..", "..", "..", "..", "help", `${file}.help`);
  return fs.existsSync(helpPath);
}

const printHelpFile = (file: string, onError?: () => void) => {
  const helpPath = path.join(__dirname, "..", "..", "..", "..", "help", `${file}.help`);
  try {
    const file = fs.readFileSync(helpPath, "utf-8");
    console.log(file);
  } catch (error) {
    onError?.();
  }
}

const printHelp = () => {
  printHelpFile("usage");

  console.log(`\nGlobal Options:`);
  // todo: define these help strings with the global args
  console.log(`\t--plain\t\tPrint output with no formatting`)
  console.log(`\t--json\t\tFormat response body JSON`)
  console.log(`\t--no-color\t\tDo not include color in output`)
  console.log(`\t--version\t\tPrint version information`)
  console.log(`\t--help\t\tPrint help information`)

  // todo: define these output messages in the command definition
  console.log(`\nAvailable Commands:`);
  console.log(`  init\t\t\tInitialize a new owl store`);
  console.log(`  request\t\tManage the request library or issue a request`);
  console.log(`  env\t\t\tView or update the environments`);
  console.log(`  state\t\t\tView or update the states`);
  console.log(`  history\t\tShow the history of requests`);
  console.log(`  show\t\t\tShow a specific completed request`);
  console.log(`  last\t\t\tShow the most recent specific completed request`);
}

export const HelpCommand: Command = {
  name: "help",
  options: [],
  run
}