import { CommandLineOptions, OptionDefinition } from "command-line-args";
import commandLineArgs from "command-line-args";
import { quote } from 'shell-quote';
import { request, RequestDefinition } from "../../../core";
import { unwrap } from "../../lib/errors";
import { Command } from "../command";
import _ from "lodash";
import { argsUtil } from "../../lib/argsUtil";
import { RequestHeader } from "../../../core/schemas/requestSchema";
import { down } from "../../../core/store/migrations/20211120215235_initial";

const run = async (args: CommandLineOptions): Promise<void> => {
  // console.log("args: ", args);

  let unknown = args._unknown ?? [];
  let definition: Partial<RequestDefinition> = {};

  // parse import formats
  if (unknown.length > 1 && unknown[0] == '--') {
    // validation: validate no other arguments

    const importStr = quote(unknown.slice(1));
    const resConvert = request.convert(importStr);
    definition = await unwrap(resConvert);
  } else {
    // parse argument formats

    let method: string | undefined = args.method;
    let url: string | undefined = args.url;
    let headers: RequestHeader[] = args.header?.map(argsUtil.parseHttpHeaderArg)?.filter((x: any) => x) ?? [];

    if (unknown.length > 0 && unknown[0] != '--') {
      url = unknown.shift();
    }

    // parse everything after the unknown (url)
    let remaining = commandLineArgs(nonPositionalOptions, { argv: unknown, partial: true });


    // validation: check that method wasn't previously set
    if (Boolean(method) && Boolean(remaining.method)) {
      console.error(`Multiple values for method were provided.`);
      process.exit(1);
    }
    method = method ?? remaining.method;
    headers = headers.concat(remaining.header?.map(argsUtil.parseHttpHeaderArg)?.filter((x: any) => x) ?? []);

    // validation: check that no header was set multiple times
    const duplicateHeaders = hasDuplicateHeaders(headers);
    if (Boolean(duplicateHeaders)) {
      console.error(`Multiple headers for '${duplicateHeaders}' were provided.`);
      process.exit(1);
    }

    definition = {
      url,
      method,
      headers
    }
  }

  await unwrap(request.create(args.request, definition as RequestDefinition));
}

const hasDuplicateHeaders  = (headers: RequestHeader[]): string | undefined => {
  const existing = new Set<string>();
  for (let idx = 0; idx < headers.length; idx++) {
    const h = headers[idx];
    const downcased = h.name.toLowerCase();
    if (existing.has(downcased)) {
      return h.name;
    }
    existing.add(downcased);
  }

  return undefined;
}

const nonPositionalOptions: OptionDefinition[] = [
  { name: "method", alias: "X" },
  { name: "header", alias: "H", lazyMultiple: true }
]

export const CreateCommand: Command = {
  name: "create",
  options: [
    { name: "request", defaultOption: true },
    { name: "url" },
    ...nonPositionalOptions
    // todo: other args?
  ],
  run,
};

