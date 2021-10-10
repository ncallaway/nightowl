import { readFile } from "fs/promises";
import { Curl } from "node-libcurl";
import { argv } from "process";
import path from "path";

import { RequestDefinition } from "../core";
import { Network } from "../core/network";

export const main = async () => {
  const remaining = argv.slice(2);
  if (remaining.length == 0) {
    console.log("usage instructions?");
    process.exit(1);
  }

  const requestKey = remaining.shift() as string;

  console.log("request is: ", requestKey);

  const requestDefinition = await loadRequest(requestKey);

  const requestResult = await issueRequest(requestDefinition);

  console.log("response status: ", requestResult);
};

const issueRequest = (definition: RequestDefinition): Promise<number> => Network.performRequest(definition);

const loadRequest = async (request: string): Promise<RequestDefinition> => {
  const req = `${request}.json`;
  const requestPath = path.join(".owl", req);

  const requestContent = await readFile(requestPath, "utf-8");
  const requestFile = JSON.parse(requestContent) as RequestDefinition;

  return requestFile;
};
