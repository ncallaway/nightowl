import { Command } from "../command";

const printHelp = async (): Promise<void> => {
  console.log(`\nUsage: owl [global options] COMMAND [command options]`);
  console.log(`\nNight Owl`);

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
  run: printHelp
}