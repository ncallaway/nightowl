import fs from "fs";
import { readFile } from "fs/promises";
import { Curl } from "node-libcurl";
import path from "path";
import { argv } from "process";
import tls from "tls";
import { RequestDefinition } from "../core";

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

  console.log("request result: ", requestResult);
};

const issueRequest = (definition: RequestDefinition): Promise<number> => {
  return new Promise((resolve, reject) => {
    console.log("issuing request: ", definition);

    const curl = new Curl();

    curl.setOpt("URL", definition.url);
    curl.setOpt("FOLLOWLOCATION", definition.settingFollowRedirects);

    // Setup CA Root Certificates
    // const baseCAPath = `/tmp`;
    // const fullCAPath = pathJoin(baseCAPath, "ca-certs.pem");

    // try {
    //   fs.statSync(fullCAPath);
    // } catch (err) {
    //   // Doesn't exist yet, so write it
    //   mkdirp.sync(baseCAPath);
    //   // TODO: Should mock cacerts module for testing. This is literally
    //   // coercing a function to string in tests due to lack of val-loader.
    //   fs.writeFileSync(fullCAPath, String(caCerts));
    //   console.log("[net] Set CA to", fullCAPath);
    // }

    const certFilePath = path.join(__dirname, "cert.pem");

    const tlsData = tls.rootCertificates.join("\n");
    fs.writeFileSync(certFilePath, tlsData);

    curl.setOpt(Curl.option.CAINFO, certFilePath);

    // curl.setOpt(Curl.option.SSL_VERIFYHOST, 0);
    // curl.setOpt(Curl.option.SSL_VERIFYPEER, 0);

    curl.on("end", function (statusCode, data, headers) {
      console.log("END");
      console.info(statusCode);
      console.info("---");
      console.info(data.length);
      console.info("---");
      console.info(this.getInfo("TOTAL_TIME"));

      resolve(statusCode);

      this.close();
    });

    curl.on("error", (a, b, c) => {
      console.log("error", a, b);
      curl.close.bind(curl);
    });
    curl.perform();
    console.log("called curl.perform");
  });
};

const loadRequest = async (request: string): Promise<RequestDefinition> => {
  const req = `${request}.json`;
  const requestPath = path.join(".owl", req);

  const requestContent = await readFile(requestPath, "utf-8");
  const requestFile = JSON.parse(requestContent) as RequestDefinition;

  return requestFile;
};
