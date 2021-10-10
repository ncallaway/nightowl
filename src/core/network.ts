import { Curl, CurlFeature, CurlInfoDebug } from "node-libcurl";
import tls from "tls";
import fs from "fs";
import path from "path";
import { RequestDefinition } from ".";
import cluster from "cluster";
import { RenderedRequest } from "./insomniaTypes";

const performRequest = (definition: RenderedRequest): Promise<number> => {
  return new Promise((resolve, reject) => {
    console.log("issuing request: ", definition);

    const curl = new Curl();

    // Set all the basic options
    curl.setOpt(Curl.option.VERBOSE, true);

    // True so debug function works\
    curl.setOpt(Curl.option.NOPROGRESS, true);

    // True so curl doesn't print progress
    curl.setOpt(Curl.option.ACCEPT_ENCODING, "");

    // Auto decode everything
    curl.enable(CurlFeature.Raw);

    curl.setOpt("URL", definition.url);

    curl.setOpt(Curl.option.FOLLOWLOCATION, curlOptFollowLocation(definition));

    const method = curlOptMethod(definition);

    console.log("setting: ", method);
    curl.setOpt(method.opt, method.value);

    // required for POST
    curl.setOpt(Curl.option.POSTFIELDS, "");

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

    /// TESTING Operation was aborted by an app callback

    curl.setOpt(Curl.option.DEBUGFUNCTION, (infoType, contentBuffer) => {
      console.log("DEBUG FUNCTION", infoType);

      switch (infoType) {
        case CurlInfoDebug.DataIn:
          console.log("DATA IN");
          return 0;
        case CurlInfoDebug.DataOut:
          console.log("DATA OUT");
          return 0;
        case CurlInfoDebug.HeaderIn:
          console.log("HEADER IN");
          return 0;
        case CurlInfoDebug.HeaderOut:
          console.log("HEADER OUT");
          return 0;
        case CurlInfoDebug.SslDataIn:
          console.log("SSL DATA IN");
          return 0;
        case CurlInfoDebug.SslDataOut:
          console.log("SSL DATA OUT");
          return 0;
        case CurlInfoDebug.Text:
          console.log("TEXT");
          return 0;
      }
      return 0;
      // const content = contentBuffer.toString("utf8");
      // const rawName = Object.keys(CurlInfoDebug).find((k) => CurlInfoDebug[k] === infoType) || "";
      // const name = LIBCURL_DEBUG_MIGRATION_MAP[rawName] || rawName;

      // if (infoType === CurlInfoDebug.SslDataIn || infoType === CurlInfoDebug.SslDataOut) {
      //   return 0;
      // }

      // // Ignore the possibly large data messages
      // if (infoType === CurlInfoDebug.DataOut) {
      //   if (contentBuffer.length === 0) {
      //     // Sometimes this happens, but I'm not sure why. Just ignore it.
      //   } else if (contentBuffer.length / 1024 < settings.maxTimelineDataSizeKB) {
      //     addTimeline(name, content);
      //   } else {
      //     addTimeline(name, `(${describeByteSize(contentBuffer.length)} hidden)`);
      //   }

      //   return 0;
      // }

      // if (infoType === CurlInfoDebug.DataIn) {
      //   addTimelineText(`Received ${describeByteSize(contentBuffer.length)} chunk`);
      //   return 0;
      // }

      // // Don't show cookie setting because this will display every domain in the jar
      // if (infoType === CurlInfoDebug.Text && content.indexOf("Added cookie") === 0) {
      //   return 0;
      // }

      // addTimeline(name, content);
      // return 0; // Must be here
    });

    curl.setOpt(Curl.option.WRITEFUNCTION, (buff) => {
      // responseBodyBytes += buff.length;
      // responseBodyWriteStream.write(buff);
      console.log("got back: ", buff.length);
      return buff.length;
    });

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
      console.log("ERRR", a, b);
      curl.close.bind(curl);
    });
    curl.perform();
    console.log("issued request...waiting");
  });
};

const curlOptFollowLocation = (definition: RequestDefinition): boolean => {
  switch (definition.settingFollowRedirects) {
    case "off":
      return false;

    case "on":
      return true;

    default:
      // todo: Have global settings
      return true;
  }
};

const curlOptMethod = (definition: RequestDefinition) => {
  // Only set CURLOPT_CUSTOMREQUEST if not HEAD or GET. This is because Curl
  // See https://curl.haxx.se/libcurl/c/CURLOPT_CUSTOMREQUEST.html
  switch (definition.method.toUpperCase()) {
    case "HEAD":
      return { opt: Curl.option.NOBODY, value: 1 };

    case "POST":
      console.log("IS POST: ", Curl.option.POST);
      return { opt: Curl.option.POST, value: 1 };

    default:
      return { opt: Curl.option.CUSTOMREQUEST, value: definition.method };
  }
};

export const Network = {
  performRequest,
};
