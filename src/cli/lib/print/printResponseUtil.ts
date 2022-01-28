import chalk from "chalk";
import fs from "fs/promises";
import { ResponsePatch } from "../../../core/insomniaTypes";

type PrintOptions = {
  requestHeaders?: boolean;
  responseHeaders?: boolean;
  status?: boolean;
  paths?: boolean;
  requestId?: boolean;
  requestUrl?: boolean;
};

const print = async (result: ResponsePatch, options: PrintOptions = {}): Promise<void> => {
  const method = chalkMethod(result.method, result.method);

  const anyMetadata =
    options.paths || options.requestId || options.requestUrl || options.status || options.responseHeaders;

  if (options.paths) {
    if (result.timelinePath) {
      log(chalk.dim(`timeline: ${result.timelinePath}`));
    }

    if (result.bodyPath && result.bytesRead) {
      log(chalk.dim(`body: ${result.bodyPath}`));
    }
  }

  if (options.requestId) {
    log(chalk.dim(`request id: ${result.parentId}`));
  }

  if (options.requestUrl) {
    logOut(`${method} ${result.url}`);
  }

  if (options.requestHeaders) {
    result.requestHeaders?.forEach((h) => {
      logOut(`${h.name}: ${h.value}`);
    });
  }

  if (options.status) {
    logIn(chalkStatus(result.statusCode, `${result.statusCode} ${result.statusMessage}`));
  }

  if (options.responseHeaders) {
    result.headers?.forEach((h) => {
      logIn(`${h.name}: ${h.value}`);
    });
  }

  if (anyMetadata) {
    log(chalk.dim("---"));
  }

  if (result.bodyPath && result.bytesRead) {
    if (result.bytesRead < 4096) {
      const body = await fs.readFile(result.bodyPath, "utf-8");
      console.log(body);
    } else {
      console.log(`body written to: ${result.bodyPath}`);
    }
  }
};

export const printResponseUtil = {
  print,
};

const log = (message?: any, ...optionalParams: any[]) => console.log(message, ...optionalParams);

const logIn = (message?: any, ...optionalParams: any[]) => {
  log(`${inArrow} ${message}`, ...optionalParams);
};
const logOut = (message?: any, ...optionalParams: any[]) => {
  log(`${outArrow} ${message}`, ...optionalParams);
};

const chalkStatus = (statusCode: number | undefined, message: string) => {
  if (!statusCode) {
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

const chalkMethod = (method: string, message: string) => {
  if (!method) {
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

const inArrow = chalk.dim("<");
const outArrow = chalk.dim(">");
