import chalk from "chalk";
import Table from "cli-table3";
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
    logIn(chalkedStatusMessage(result));
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

const printSummaryTable = async (requests: ResponsePatch[]): Promise<void> => {
  const table = new Table({
    head: ["-", "status", "url", "id"],
    style: {
      head: [],
    },
  });

  const rows = requests.map((r, idx) => {
    const method = chalkMethod(r.method, r.method);

    const elidedUrl = elide(r.url, 80);
    const url = `${method} ${elidedUrl}`;

    return [idx + 1, chalkedStatusMessage(r) || "", url, chalk.dim(r.parentId)];
  });

  table.push(...rows);

  console.log(table.toString());
};

const elide = (str: string, n = 100) => {
  if (str.length < n - 1) {
    return str;
  }

  const mid = (n - 2) / 2;
  const fromlast = str.length - (n - 2) / 2;

  const head = String(str).substring(0, mid);
  const tail = String(str).substring(fromlast);

  return `${head}…${tail}`;
};

export const printResponseUtil = {
  print,
  printSummaryTable,
};

const log = (message?: any, ...optionalParams: any[]) => console.log(message, ...optionalParams);

const logIn = (message?: any, ...optionalParams: any[]) => {
  log(`${inArrow} ${message}`, ...optionalParams);
};
const logOut = (message?: any, ...optionalParams: any[]) => {
  log(`${outArrow} ${message}`, ...optionalParams);
};

const chalkedStatusMessage = (r: ResponsePatch) => chalkStatus(r.statusCode, `${r.statusCode} ${r.statusMessage}`);

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
