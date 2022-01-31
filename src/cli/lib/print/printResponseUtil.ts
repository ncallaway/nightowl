import Table from "cli-table3";
import { CommandLineOptions } from "command-line-args";
import fs from "fs/promises";
import { ResponsePatch } from "../../../core/insomniaTypes";
import { g } from "../globals";
import { colorUtil } from "./colorUtil";
import { formatUtil } from "./formatUtil";

type PrintOptions = {
  requestHeaders?: boolean;
  responseHeaders?: boolean;
  status?: boolean;
  paths?: boolean;
  requestId?: boolean;
  requestUrl?: boolean;
  noBody?: boolean;
};

const print = async (result: ResponsePatch, options: PrintOptions = {}): Promise<void> => {
  const anyRequest = options.requestHeaders || options.requestUrl;
  const anyResponse = options.status || options.responseHeaders;

  const anyMetadata = options.paths || anyRequest || anyResponse;

  const out: any = {};

  if (options.paths) {
    out.timelinePath = result.timelinePath;

    if (result.bytesRead) {
      out.bodyPath = result.bodyPath;
    }
  }

  if (options.requestId) {
    out.requestId = result.parentId;
  }

  if (options.requestUrl) {
    out.method = result.method;
    out.url = result.url;
  }

  if (options.requestHeaders) {
    out.requesHeaders = result.requestHeaders;
  }

  if (options.status) {
    out.statusCode = result.statusCode;
    out.statusMessage = result.statusMessage;
  }

  if (options.responseHeaders) {
    out.responseHeaders = result.headers;
  }

  if (g.json) {
    if (!options.noBody) {
      if (result.bodyPath && result.bytesRead) {
        let body = await fs.readFile(result.bodyPath, "utf-8");
        try {
          body = JSON.parse(body);
        } catch (e: any) {
          // we'll leave the body as it was if it wasn't json
        }
        out.body = body;
      } else {
        out.body = null;
      }
    }

    console.log(JSON.stringify(out, null, 2));
    return;
  }

  if (out.timelinePath) {
    log(colorUtil.dim(`timeline: ${out.timelinePath}`));
  }

  if (out.bodyPath) {
    log(colorUtil.dim(`body: ${out.bodyPath}`));
  }

  if (out.requestId) {
    log(colorUtil.dim(`request id: ${out.parentId}`));
  }

  if (options.requestUrl) {
    logOut(formatUtil.methurl(result));
  }

  out.requestHeaders?.forEach((h: any) => {
    logOut(`${h.name}: ${h.value}`);
  });

  if (anyRequest && anyResponse) {
    log(colorUtil.dim("---"));
  }

  if (options.status) {
    logIn(formatUtil.statusMessage(result));
  }

  out.responseHeaders?.forEach((h: any) => {
    logIn(`${h.name}: ${h.value}`);
  });

  if (anyMetadata && !options.noBody) {
    log(colorUtil.dim("---"));
  }

  if (!options.noBody && result.bodyPath && result.bytesRead) {
    if (result.bytesRead < 4096 || g.plain) {
      const body = await fs.readFile(result.bodyPath, "utf-8");
      console.log(body);
    } else {
      console.log(`body written to: ${result.bodyPath}`);
    }
  }
};

const printSummaryTable = async (requests: ResponsePatch[]): Promise<void> => {
  if (g.json) {
    const rows = requests.map((r, idx) => {
      return {
        row: idx + 1,
        id: r.parentId,
        statusCode: r.statusCode,
        statusMessage: r.statusMessage,
        method: r.method,
        url: r.url,
      };
    });

    console.log(JSON.stringify(rows, null, 2));
    return;
  }

  const table = new Table({
    head: ["-", "status", "url", "id"],
    style: {
      head: [],
    },
  });

  const rows = requests.map((r, idx) => {
    const elide = g.plain ? undefined : 80;
    return [idx + 1, formatUtil.statusMessage(r), formatUtil.methurl(r, elide), colorUtil.dim(r.parentId)];
  });

  table.push(...rows);

  if (g.plain) {
    rows.forEach((row) => {
      console.log(row.join("\t"));
    });
  } else {
    console.log(table.toString());
  }
};

const printOptionsFromArgs = (args: CommandLineOptions): PrintOptions => {
  return {
    requestId: args.include || args.verbose,
    requestUrl: args.url || args.include || args.verbose,
    requestHeaders: args.verbose,
    status: args.status || args.include || args.verbose,
    responseHeaders: args.include || args.verbose,
    paths: args.include || args.verbose,
    noBody: args["no-body"],
  };
};

export const printResponseUtil = {
  print,
  printSummaryTable,
  printOptionsFromArgs,
};

const log = (message?: any, ...optionalParams: any[]) => console.log(message, ...optionalParams);

const logIn = (message?: any, ...optionalParams: any[]) => {
  log(`${inArrow()} ${message}`, ...optionalParams);
};
const logOut = (message?: any, ...optionalParams: any[]) => {
  log(`${outArrow()} ${message}`, ...optionalParams);
};

const inArrow = () => colorUtil.dim("<");
const outArrow = () => colorUtil.dim(">");
