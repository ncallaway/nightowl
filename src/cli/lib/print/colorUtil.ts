import chalk from "chalk";
import { CommandLineOptions } from "command-line-args";
import { stderr, stdout } from "process";
import { g } from "../globals";

const chalkMethod = (method: string, message: string = method) => {
  if (!method || !g.color) {
    return message;
  }

  const lowerMethod = method.toLowerCase();

  if (lowerMethod == "get") {
    return chalk.blue(message);
  }

  if (lowerMethod == "post") {
    return chalk.green(message);
  }

  if (lowerMethod == "delete") {
    return chalk.red(message);
  }

  return message;
};

const chalkStatus = (statusCode: number | undefined, message: string | undefined = String(statusCode)) => {
  if (!statusCode || !g.color) {
    return message;
  }

  if (statusCode < 200) {
    return chalk.yellow(statusCode);
  }
  if (statusCode >= 200 && statusCode < 300) {
    return chalk.green(statusCode);
  }
  if (statusCode >= 300 && statusCode < 400) {
    return chalk.yellow(statusCode);
  }
  if (statusCode >= 400) {
    return chalk.red(statusCode);
  }
};

const dim = (message: string) => {
  if (!g.color) {
    return message;
  }
  return chalk.dim(message);
};

const noColor = (args: CommandLineOptions): boolean => {
  // stdout or stderr is not an interactive terminal (a TTY). It’s best to individually check—if you’re piping stdout to another program, it’s still useful to get colors on stderr.
  // The NO_COLOR environment variable is set.
  // The TERM environment variable has the value dumb.
  // The user passes the option --no-color.
  // You may also want to add a MYAPP_NO_COLOR environment variable in case users want to disable color specifically for your program.
  const notTty = !stdout.isTTY || !stderr.isTTY;

  const env = Boolean(process.env.NO_COLOR || process.env.OWL_NO_COLOR || process.env.TERM == "dumb");

  const arg = Boolean(args["no-color"] || args.plain || args.json);

  return notTty || env || arg;
};

export const colorUtil = {
  chalkMethod,
  chalkStatus,
  dim,
  noColor,
};
