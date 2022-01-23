// @ts-ignore
import { version } from "../../../package.json";
import { createHash } from "crypto";
import fs from "fs";
import _ from "lodash";
import mkdirp from "mkdirp";
import { Curl, CurlAuth, CurlCode, CurlFeature, CurlHttpVersion, CurlInfoDebug, CurlNetrc } from "node-libcurl";
import { join as pathJoin } from "path";
import tls from "tls";
import { RequestDefinition } from "..";
import { RenderedRequest, ResponseHeader, ResponsePatch, ResponseTimelineEntry } from "../insomniaTypes";
import {
  getContentTypeHeader,
  getLocationHeader,
  getSetCookieHeaders,
  hasAcceptEncodingHeader,
  hasAcceptHeader,
  hasAuthHeader,
  hasContentTypeHeader,
  hasUserAgentHeader,
} from "./misc";

import { cookiesFromJar, jarFromCookies } from "./cookies";
import { getAuthHeader } from "./authentication";
import { buildMultipart } from "./multipart";
import { v4 as uuidv4 } from "uuid"; // NOTE: This is last because headers might be modified multiple times
import { resolve as urlResolve } from "url";
import {
  AUTH_DIGEST,
  AUTH_NETRC,
  AUTH_NTLM,
  CONTENT_TYPE_FORM_DATA,
  CONTENT_TYPE_FORM_URLENCODED,
  HttpVersions,
} from "../constants";
import { Readable, Writable } from "stream";
import { format as urlFormat, parse as urlParse } from "url";
import { owlpaths } from "../lib/owlpaths";
import { render } from "nunjucks";

const getDataDirectory = owlpaths.globalDataDir;
const getTempDir = owlpaths.globalTempDir;

const DISABLE_HEADER_VALUE = "__Di$aB13d__";

const cancelRequestFunctionMap: Record<string, () => Promise<void>> = {};

const settings = {
  followRedirects: true,
  maxRedirects: 10,
  maxTimelineDataSizeKB: 1024,
  preferredHttpVersion: HttpVersions.V1_1 as any,
  timeout: 30000,
};

// adapted from: export async function _actuallySend (https://github.com/Kong/insomnia/blob/83477364c68dea794274929d499658885143729c/packages/insomnia-app/app/network/network.ts#L137)
const performRequest = (renderedRequest: RenderedRequest, validateSSL = true): Promise<ResponsePatch> => {
  return new Promise(async (resolve) => {
    const timeline: ResponseTimelineEntry[] = [];

    const addTimeline = (name: string, value: string) => {
      timeline.push({
        name,
        value,
        timestamp: Date.now(),
      });
    };

    const addTimelineText = (value: string) => {
      addTimeline("TEXT", value);
    };

    // Initialize the curl handle
    const curl = new Curl();

    async function respond(patch: ResponsePatch, bodyPath: string | null, noPlugins = false) {
      const timelinePath = await storeTimeline(timeline);
      // Tear Down the cancellation logic
      clearCancelFunctionForId(renderedRequest._id);
      // const environmentId = environment ? environment._id : null;
      const responsePatchBeforeHooks = Object.assign(
        {
          timelinePath,
          // environmentId,
          parentId: renderedRequest._id,
          key: renderedRequest._key,
          bodyCompression: null,
          // Will default to .zip otherwise
          bodyPath: bodyPath || "",
          settingSendCookies: renderedRequest.settingSendCookies,
          settingStoreCookies: renderedRequest.settingStoreCookies,
        } as ResponsePatch,
        patch
      );

      if (noPlugins) {
        resolve(responsePatchBeforeHooks);
        return;
      }

      let responsePatch: ResponsePatch | null = null;

      // try {
      //   responsePatch = await _applyResponsePluginHooks(responsePatchBeforeHooks, renderedRequest, renderContext);
      // } catch (err) {
      //   await handleError(new Error(`[plugin] Response hook failed plugin=${err.plugin.name} err=${err.message}`));
      //   return;
      // }
      responsePatch = responsePatchBeforeHooks;

      resolve(responsePatch);
    }

    /** Helper function to respond with an error */
    const handleError = async (err: Error) => {
      await respond(
        {
          parentId: renderedRequest._id,
          key: renderedRequest._key,
          url: renderedRequest.url,
          method: renderedRequest.method,
          error: err.message,
          elapsedTime: 0, // 0 because this path is hit during plugin calls
          statusMessage: "Error",
          settingSendCookies: renderedRequest.settingSendCookies,
          settingStoreCookies: renderedRequest.settingStoreCookies,
        },
        null,
        true
      );
    };

    /** Helper function to set Curl options */
    const setOpt: typeof curl.setOpt = (opt: any, val: any) => {
      try {
        return curl.setOpt(opt, val);
      } catch (err) {
        // @ts-ignore
        const name = Object.keys(Curl.option).find((name) => Curl.option[name] === opt);
        // @ts-ignore
        throw new Error(`${err.message} (${opt} ${name || "n/a"})`);
      }
    };

    try {
      // Setup the cancellation logic
      cancelRequestFunctionMap[renderedRequest._id] = async () => {
        await respond(
          {
            elapsedTime: ((curl.getInfo(Curl.info.TOTAL_TIME) as number) || 0) * 1000,
            // @ts-expect-error -- needs generic
            bytesRead: curl.getInfo(Curl.info.SIZE_DOWNLOAD),
            // @ts-expect-error -- needs generic
            url: curl.getInfo(Curl.info.EFFECTIVE_URL),
            statusMessage: "Cancelled",
            error: "Request was cancelled",
          },
          null,
          true
        );
        // Kill it!
        curl.close();
      };

      // Set all the basic options
      setOpt(Curl.option.VERBOSE, true);

      // True so debug function works\
      setOpt(Curl.option.NOPROGRESS, true);

      // True so curl doesn't print progress
      setOpt(Curl.option.ACCEPT_ENCODING, "");

      // Auto decode everything
      curl.enable(CurlFeature.Raw);

      // Set follow redirects setting
      switch (renderedRequest.settingFollowRedirects) {
        case "off":
          setOpt(Curl.option.FOLLOWLOCATION, false);
          break;

        case "on":
          setOpt(Curl.option.FOLLOWLOCATION, true);
          break;

        default:
          // Set to global setting
          setOpt(Curl.option.FOLLOWLOCATION, settings.followRedirects);
          break;
      }

      // Set maximum amount of redirects allowed
      // NOTE: Setting this to -1 breaks some versions of libcurl
      if (settings.maxRedirects > 0) {
        setOpt(Curl.option.MAXREDIRS, settings.maxRedirects);
      }

      // Don't rebuild dot sequences in path
      if (!renderedRequest.settingRebuildPath) {
        setOpt(Curl.option.PATH_AS_IS, true);
      }

      // Only set CURLOPT_CUSTOMREQUEST if not HEAD or GET. This is because Curl
      // See https://curl.haxx.se/libcurl/c/CURLOPT_CUSTOMREQUEST.html
      switch (renderedRequest.method.toUpperCase()) {
        case "HEAD":
          // This is how you tell Curl to send a HEAD request
          setOpt(Curl.option.NOBODY, 1);
          break;

        case "POST":
          // This is how you tell Curl to send a POST request
          setOpt(Curl.option.POST, 1);
          break;

        case "GET":
          setOpt(Curl.option.HTTPGET, 1);
          break;

        default:
          // IMPORTANT: Only use CUSTOMREQUEST for all but HEAD and POST
          setOpt(Curl.option.CUSTOMREQUEST, renderedRequest.method);
          break;
      }

      // Setup debug handler
      setOpt(Curl.option.DEBUGFUNCTION, (infoType, contentBuffer) => {
        const content = contentBuffer.toString("utf8");
        // @ts-ignore
        const rawName = Object.keys(CurlInfoDebug).find((k) => CurlInfoDebug[k] === infoType) || "";
        // const name = LIBCURL_DEBUG_MIGRATION_MAP[rawName] || rawName;
        const name = rawName;

        if (infoType === CurlInfoDebug.SslDataIn || infoType === CurlInfoDebug.SslDataOut) {
          return 0;
        }

        // Ignore the possibly large data messages
        if (infoType === CurlInfoDebug.DataOut) {
          if (contentBuffer.length === 0) {
            // Sometimes this happens, but I'm not sure why. Just ignore it.
          } else if (contentBuffer.length / 1024 < settings.maxTimelineDataSizeKB) {
            addTimeline(name, content);
          } else {
            addTimeline(name, `(${describeByteSize(contentBuffer.length)} hidden)`);
          }

          return 0;
        }

        if (infoType === CurlInfoDebug.DataIn) {
          addTimelineText(`Received ${describeByteSize(contentBuffer.length)} chunk`);
          return 0;
        }

        // Don't show cookie setting because this will display every domain in the jar
        if (infoType === CurlInfoDebug.Text && content.indexOf("Added cookie") === 0) {
          return 0;
        }

        addTimeline(name, content);
        return 0; // Must be here
      });
      // Set the headers (to be modified as we go)
      const headers = _.clone(renderedRequest.headers);
      // Set the URL, including the query parameters
      const qs = buildQueryStringFromParams(renderedRequest.parameters);
      const url = joinUrlAndQueryString(renderedRequest.url, qs);
      const isUnixSocket = url.match(/https?:\/\/unix:\//);
      const finalUrl = smartEncodeUrl(url, renderedRequest.settingEncodeUrl);

      if (isUnixSocket) {
        // URL prep will convert "unix:/path" hostname to "unix/path"
        const match = finalUrl.match(/(https?:)\/\/unix:?(\/[^:]+):\/(.+)/);
        const protocol = (match && match[1]) || "";
        const socketPath = (match && match[2]) || "";
        const socketUrl = (match && match[3]) || "";
        setOpt(Curl.option.URL, `${protocol}//${socketUrl}`);
        setOpt(Curl.option.UNIX_SOCKET_PATH, socketPath);
      } else {
        setOpt(Curl.option.URL, finalUrl);
      }

      addTimelineText("Preparing request to " + finalUrl);
      addTimelineText("Current time is " + new Date().toISOString());
      addTimelineText(`Using ${Curl.getVersion()}`);

      // Set HTTP version
      switch (settings.preferredHttpVersion) {
        case HttpVersions.V1_0:
          addTimelineText("Using HTTP 1.0");
          setOpt(Curl.option.HTTP_VERSION, CurlHttpVersion.V1_0);
          break;

        case HttpVersions.V1_1:
          addTimelineText("Using HTTP 1.1");
          setOpt(Curl.option.HTTP_VERSION, CurlHttpVersion.V1_1);
          break;

        case HttpVersions.V2_0:
          addTimelineText("Using HTTP/2");
          setOpt(Curl.option.HTTP_VERSION, CurlHttpVersion.V2_0);
          break;

        case HttpVersions.v3:
          addTimelineText("Using HTTP/3");
          setOpt(Curl.option.HTTP_VERSION, CurlHttpVersion.v3);
          break;

        case HttpVersions.default:
          addTimelineText("Using default HTTP version");
          break;

        default:
          addTimelineText(`Unknown HTTP version specified ${settings.preferredHttpVersion}`);
          break;
      }

      // Set timeout
      if (settings.timeout > 0) {
        addTimelineText(`Enable timeout of ${settings.timeout}ms`);
        setOpt(Curl.option.TIMEOUT_MS, settings.timeout);
      } else {
        addTimelineText("Disable timeout");
        setOpt(Curl.option.TIMEOUT_MS, 0);
      }

      // log some things
      if (renderedRequest.settingEncodeUrl) {
        addTimelineText("Enable automatic URL encoding");
      } else {
        addTimelineText("Disable automatic URL encoding");
      }

      // SSL Validation
      if (validateSSL) {
        addTimelineText("Enable SSL validation");
      } else {
        setOpt(Curl.option.SSL_VERIFYHOST, 0);
        setOpt(Curl.option.SSL_VERIFYPEER, 0);
        addTimelineText("Disable SSL validation");
      }

      // Setup CA Root Certificates
      const baseCAPath = getTempDir();
      const fullCAPath = pathJoin(baseCAPath, "ca-certs.pem");

      try {
        fs.statSync(fullCAPath);
      } catch (err) {
        // Doesn't exist yet, so write it
        mkdirp.sync(baseCAPath);
        // TODO: Should mock cacerts module for testing. This is literally
        // coercing a function to string in tests due to lack of val-loader.
        const tlsData = tls.rootCertificates.join("\n");
        fs.writeFileSync(fullCAPath, String(tlsData));
        console.log("[net] Set CA to", fullCAPath);
      }

      setOpt(Curl.option.CAINFO, fullCAPath);

      // Set cookies from jar
      if (renderedRequest.settingSendCookies) {
        // Tell Curl to store cookies that it receives. This is only important if we receive
        // a cookie on a redirect that needs to be sent on the next request in the chain.
        setOpt(Curl.option.COOKIEFILE, "");
        const cookies = renderedRequest.cookieJar.cookies || [];

        for (const cookie of cookies) {
          let expiresTimestamp = 0;

          if (cookie.expires) {
            const expiresDate = new Date(cookie.expires);
            expiresTimestamp = Math.round(expiresDate.getTime() / 1000);
          }

          setOpt(
            Curl.option.COOKIELIST,
            [
              cookie.httpOnly ? `#HttpOnly_${cookie.domain}` : cookie.domain,
              cookie.hostOnly ? "FALSE" : "TRUE",
              cookie.path,
              cookie.secure ? "TRUE" : "FALSE",
              expiresTimestamp,
              cookie.key,
              cookie.value,
            ].join("\t")
          );
        }

        for (const { name, value } of renderedRequest.cookies) {
          setOpt(Curl.option.COOKIE, `${name}=${value}`);
        }

        addTimelineText(`Enable cookie sending with jar of ${cookies.length} cookie${cookies.length !== 1 ? "s" : ""}`);
      } else {
        addTimelineText("Disable cookie sending due to user setting");
      }

      // NETTODO: PROXY SUPPORT
      // Set proxy settings if we have them
      // if (settings.proxyEnabled) {
      //   const { protocol } = urlParse(renderedRequest.url);
      //   const { httpProxy, httpsProxy, noProxy } = settings;
      //   const proxyHost = protocol === "https:" ? httpsProxy : httpProxy;
      //   const proxy = proxyHost ? setDefaultProtocol(proxyHost) : null;
      //   addTimelineText(`Enable network proxy for ${protocol || ""}`);

      //   if (proxy) {
      //     setOpt(Curl.option.PROXY, proxy);
      //     setOpt(Curl.option.PROXYAUTH, CurlAuth.Any);
      //   }

      //   if (noProxy) {
      //     setOpt(Curl.option.NOPROXY, noProxy);
      //   }
      // } else {
      //   setOpt(Curl.option.PROXY, "");
      // }

      // NETTODO: CLIENT CERTS
      // Set client certs if needed
      // const clientCertificates = await models.clientCertificate.findByParentId(workspace._id);

      // for (const certificate of (clientCertificates || [])) {
      //   if (certificate.disabled) {
      //     continue;
      //   }

      //   const cHostWithProtocol = setDefaultProtocol(certificate.host, 'https:');

      //   if (urlMatchesCertHost(cHostWithProtocol, renderedRequest.url)) {
      //     const ensureFile = blobOrFilename => {
      //       try {
      //         fs.statSync(blobOrFilename);
      //       } catch (err) {
      //         // Certificate file not found!
      //         // LEGACY: Certs used to be stored in blobs (not as paths), so let's write it to
      //         // the temp directory first.
      //         const fullBase = getTempDir();
      //         const name = `${renderedRequest._id}_${renderedRequest.modified}`;
      //         const fullPath = pathJoin(fullBase, name);
      //         fs.writeFileSync(fullPath, Buffer.from(blobOrFilename, 'base64'));
      //         // Set filename to the one we just saved
      //         blobOrFilename = fullPath;
      //       }

      //       return blobOrFilename;
      //     };

      //     const { passphrase, cert, key, pfx } = certificate;

      //     if (cert) {
      //       setOpt(Curl.option.SSLCERT, ensureFile(cert));
      //       setOpt(Curl.option.SSLCERTTYPE, 'PEM');
      //       addTimelineText('Adding SSL PEM certificate');
      //     }

      //     if (pfx) {
      //       setOpt(Curl.option.SSLCERT, ensureFile(pfx));
      //       setOpt(Curl.option.SSLCERTTYPE, 'P12');
      //       addTimelineText('Adding SSL P12 certificate');
      //     }

      //     if (key) {
      //       setOpt(Curl.option.SSLKEY, ensureFile(key));
      //       addTimelineText('Adding SSL KEY certificate');
      //     }

      //     if (passphrase) {
      //       setOpt(Curl.option.KEYPASSWD, passphrase);
      //     }
      //   }
      // }

      // Build the body
      let noBody = false;
      let requestBody: string | null = null;
      const expectsBody = ["POST", "PUT", "PATCH"].includes(renderedRequest.method.toUpperCase());

      if (renderedRequest.body.mimeType === CONTENT_TYPE_FORM_URLENCODED) {
        requestBody = buildQueryStringFromParams(renderedRequest.body.params || [], false);
      } else if (renderedRequest.body.mimeType === CONTENT_TYPE_FORM_DATA) {
        const params = renderedRequest.body.params || [];
        const { filePath: multipartBodyPath, boundary, contentLength } = await buildMultipart(params);
        // Extend the Content-Type header
        const contentTypeHeader = getContentTypeHeader(headers);

        if (contentTypeHeader) {
          contentTypeHeader.value = `multipart/form-data; boundary=${boundary}`;
        } else {
          headers.push({
            name: "Content-Type",
            value: `multipart/form-data; boundary=${boundary}`,
          });
        }

        const fd = fs.openSync(multipartBodyPath, "r");
        setOpt(Curl.option.INFILESIZE_LARGE, contentLength);
        setOpt(Curl.option.UPLOAD, 1);
        setOpt(Curl.option.READDATA, fd);
        // We need this, otherwise curl will send it as a PUT
        setOpt(Curl.option.CUSTOMREQUEST, renderedRequest.method);

        const fn = () => {
          fs.closeSync(fd);
          fs.unlink(multipartBodyPath, () => {
            // Pass
          });
        };

        curl.on("end", fn);
        curl.on("error", fn);
      } else if (renderedRequest.body.fileName) {
        const { size } = fs.statSync(renderedRequest.body.fileName);
        const fileName = renderedRequest.body.fileName || "";
        const fd = fs.openSync(fileName, "r");
        setOpt(Curl.option.INFILESIZE_LARGE, size);
        setOpt(Curl.option.UPLOAD, 1);
        setOpt(Curl.option.READDATA, fd);
        // We need this, otherwise curl will send it as a POST
        setOpt(Curl.option.CUSTOMREQUEST, renderedRequest.method);

        const fn = () => fs.closeSync(fd);

        curl.on("end", fn);
        curl.on("error", fn);
      } else if (typeof renderedRequest.body.mimeType === "string" || expectsBody) {
        requestBody = renderedRequest.body.text || "";
      } else {
        // No body
        noBody = true;
      }

      if (!noBody) {
        // Don't chunk uploads
        headers.push({
          name: "Expect",
          value: DISABLE_HEADER_VALUE,
        });
        headers.push({
          name: "Transfer-Encoding",
          value: DISABLE_HEADER_VALUE,
        });
      }

      // If we calculated the body within Insomnia (ie. not computed by Curl)
      if (requestBody !== null) {
        setOpt(Curl.option.POSTFIELDS, requestBody);
      }

      // Handle Authorization header
      if (!hasAuthHeader(headers) && !renderedRequest.authentication.disabled) {
        if (renderedRequest.authentication.type === AUTH_DIGEST) {
          const { username, password } = renderedRequest.authentication;
          setOpt(Curl.option.HTTPAUTH, CurlAuth.Digest);
          setOpt(Curl.option.USERNAME, username || "");
          setOpt(Curl.option.PASSWORD, password || "");
        } else if (renderedRequest.authentication.type === AUTH_NTLM) {
          const { username, password } = renderedRequest.authentication;
          setOpt(Curl.option.HTTPAUTH, CurlAuth.Ntlm);
          setOpt(Curl.option.USERNAME, username || "");
          setOpt(Curl.option.PASSWORD, password || "");
          // NETTODO: AWS IAM Auth
          // } else if (renderedRequest.authentication.type === AUTH_AWS_IAM) {
          //   if (!noBody && !requestBody) {
          //     return handleError(new Error("AWS authentication not supported for provided body type"));
          //   }

          //   const { authentication } = renderedRequest;
          //   const credentials = {
          //     accessKeyId: authentication.accessKeyId || "",
          //     secretAccessKey: authentication.secretAccessKey || "",
          //     sessionToken: authentication.sessionToken || "",
          //   };

          //   const extraHeaders = _getAwsAuthHeaders(
          //     credentials,
          //     headers,
          //     requestBody || "",
          //     finalUrl,
          //     renderedRequest.method,
          //     authentication.region || "",
          //     authentication.service || ""
          //   );

          //   for (const header of extraHeaders) {
          //     headers.push(header);
          //   }
        } else if (renderedRequest.authentication.type === AUTH_NETRC) {
          setOpt(Curl.option.NETRC, CurlNetrc.Required);
        } else {
          const authHeader = await getAuthHeader(renderedRequest, finalUrl);

          if (authHeader) {
            headers.push({
              name: authHeader.name,
              value: authHeader.value,
            });
          }
        }
      }

      // Send a default Accept headers of anything
      if (!hasAcceptHeader(headers)) {
        headers.push({
          name: "Accept",
          value: "*/*",
        }); // Default to anything
      }

      // Don't auto-send Accept-Encoding header
      if (!hasAcceptEncodingHeader(headers)) {
        headers.push({
          name: "Accept-Encoding",
          value: DISABLE_HEADER_VALUE,
        });
      }

      // Set User-Agent if it's not already in headers
      if (!hasUserAgentHeader(headers)) {
        setOpt(Curl.option.USERAGENT, `nightowl/${version}`);
      }

      // Prevent curl from adding default content-type header
      if (!hasContentTypeHeader(headers)) {
        headers.push({
          name: "content-type",
          value: DISABLE_HEADER_VALUE,
        });
      }

      // NOTE: This is last because headers might be modified multiple times
      const headerStrings = headers
        .filter((h) => h.name)
        .map((h) => {
          const value = h.value || "";

          if (value === "") {
            // Curl needs a semicolon suffix to send empty header values
            return `${h.name};`;
          } else if (value === DISABLE_HEADER_VALUE) {
            // Tell Curl NOT to send the header if value is null
            return `${h.name}:`;
          } else {
            // Send normal header value
            return `${h.name}: ${value}`;
          }
        });
      setOpt(Curl.option.HTTPHEADER, headerStrings);
      let responseBodyBytes = 0;
      const responsesDir = pathJoin(getDataDirectory(), "responses");
      mkdirp.sync(responsesDir);
      const responseBodyPath = pathJoin(responsesDir, uuidv4() + ".response");
      const responseBodyWriteStream = fs.createWriteStream(responseBodyPath);
      curl.on("end", () => responseBodyWriteStream.end());
      curl.on("error", () => responseBodyWriteStream.end());
      setOpt(Curl.option.WRITEFUNCTION, (buff) => {
        responseBodyBytes += buff.length;
        responseBodyWriteStream.write(buff);
        return buff.length;
      });

      // Handle the response ending
      curl.on("end", async (_1, _2, rawHeaders: Buffer) => {
        const allCurlHeadersObjects = _parseHeaders(rawHeaders);

        // Headers are an array (one for each redirect)
        const lastCurlHeadersObject = allCurlHeadersObjects[allCurlHeadersObjects.length - 1];
        // Collect various things
        const httpVersion = lastCurlHeadersObject.version || "";
        const statusCode = lastCurlHeadersObject.code || -1;
        const statusMessage = lastCurlHeadersObject.reason || "";
        // Collect the headers
        const headers = lastCurlHeadersObject.headers;
        // Calculate the content type
        const contentTypeHeader = getContentTypeHeader(headers);
        const contentType = contentTypeHeader ? contentTypeHeader.value : "";
        // Update Cookie Jar
        let currentUrl = finalUrl;
        let setCookieStrings: string[] = [];
        const jar = jarFromCookies(renderedRequest.cookieJar.cookies);

        for (const { headers } of allCurlHeadersObjects) {
          // Collect Set-Cookie headers
          const setCookieHeaders = getSetCookieHeaders(headers);
          setCookieStrings = [...setCookieStrings, ...setCookieHeaders.map((h) => h.value)];
          // Pull out new URL if there is a redirect
          const newLocation = getLocationHeader(headers);

          if (newLocation !== null) {
            currentUrl = urlResolve(currentUrl, newLocation.value);
          }
        }

        // Update jar with Set-Cookie headers
        for (const setCookieStr of setCookieStrings) {
          try {
            jar.setCookieSync(setCookieStr, currentUrl);
          } catch (err: any) {
            addTimelineText(`Rejected cookie: ${err.message}`);
          }
        }

        // Update cookie jar if we need to and if we found any cookies
        if (renderedRequest.settingStoreCookies && setCookieStrings.length) {
          const cookies = await cookiesFromJar(jar);
          // TODONET: Cookies
          // await models.cookieJar.update(renderedRequest.cookieJar, {
          //   cookies,
          // });
        }

        // Print informational message
        if (setCookieStrings.length > 0) {
          const n = setCookieStrings.length;

          if (renderedRequest.settingStoreCookies) {
            addTimelineText(`Saved ${n} cookie${n === 1 ? "" : "s"}`);
          } else {
            addTimelineText(`Ignored ${n} cookie${n === 1 ? "" : "s"}`);
          }
        }

        // Return the response data
        const responsePatch: ResponsePatch = {
          contentType,
          headers,
          httpVersion,
          statusCode,
          statusMessage,
          bytesContent: responseBodyBytes,
          // @ts-expect-error -- TSCONVERSION appears to be a genuine error
          bytesRead: curl.getInfo(Curl.info.SIZE_DOWNLOAD),
          elapsedTime: (curl.getInfo(Curl.info.TOTAL_TIME) as number) * 1000,
          // @ts-expect-error -- TSCONVERSION appears to be a genuine error
          url: curl.getInfo(Curl.info.EFFECTIVE_URL),
          // @ts-expect-error -- TSCONVERSION appears to be a genuine error
          method: curl.getInfo(Curl.info.EFFECTIVE_METHOD),
        };
        // Close the request
        curl.close();
        // Make sure the response body has been fully written first
        await waitForStreamToFinish(responseBodyWriteStream);
        // Send response
        await respond(responsePatch, responseBodyPath);
      });
      curl.on("error", async function (err, code) {
        let error = err + "";
        let statusMessage = "Error";

        if (code === CurlCode.CURLE_ABORTED_BY_CALLBACK) {
          error = "Request aborted";
          statusMessage = "Abort";
        }

        await respond(
          {
            key: renderedRequest._key,
            parentId: renderedRequest._id,
            url: renderedRequest.url,
            method: renderedRequest.method,
            statusMessage,
            error,
            elapsedTime: (curl.getInfo(Curl.info.TOTAL_TIME) as number) * 1000,
          },
          null,
          true
        );
      });
      curl.perform();
    } catch (err: any) {
      console.log("[network] Error", err);
      await handleError(err);
    }

    // MARK

    // BAD!! BAD!!

    //   console.log("issuing request: ", renderedRequest);
    //   const headers = _.clone(renderedRequest.headers);

    //   // const curl = new Curl();

    //   // Set all the basic options
    //   curl.setOpt(Curl.option.VERBOSE, true);

    //   // True so debug function works\
    //   curl.setOpt(Curl.option.NOPROGRESS, false);

    //   // True so curl doesn't print progress
    //   curl.setOpt(Curl.option.ACCEPT_ENCODING, "");

    //   // Auto decode everything
    //   curl.enable(CurlFeature.Raw);

    //   curl.setOpt("URL", renderedRequest.url);

    //   curl.setOpt(Curl.option.FOLLOWLOCATION, curlOptFollowLocation(renderedRequest));

    //   const method = curlOptMethod(renderedRequest);

    //   console.log("setting: ", method);
    //   curl.setOpt(method.opt, method.value);

    //   // required for POST
    //   curl.setOpt(Curl.option.POSTFIELDS, "");

    //   // Setup CA Root Certificates
    //   // const baseCAPath = `/tmp`;
    //   // const fullCAPath = pathJoin(baseCAPath, "ca-certs.pem");

    //   // try {
    //   //   fs.statSync(fullCAPath);
    //   // } catch (err) {
    //   //   // Doesn't exist yet, so write it
    //   //   mkdirp.sync(baseCAPath);
    //   //   // TODO: Should mock cacerts module for testing. This is literally
    //   //   // coercing a function to string in tests due to lack of val-loader.
    //   //   fs.writeFileSync(fullCAPath, String(caCerts));
    //   //   console.log("[net] Set CA to", fullCAPath);
    //   // }

    //   const certFilePath = pathJoin(__dirname, "cert.pem");

    //   const tlsData = tls.rootCertificates.join("\n");
    //   fs.writeFileSync(certFilePath, tlsData);

    //   curl.setOpt(Curl.option.CAINFO, certFilePath);

    //   /// TESTING Operation was aborted by an app callback

    //   curl.setOpt(Curl.option.XFERINFOFUNCTION, (dTotal, d, uTotal, u) => {
    //     console.log("XFERINFO FUNCTION", dTotal, d, uTotal, u);
    //     return CurlProgressFunc.Continue;
    //   });

    //   /* eslint-disable @typescript-eslint/no-unused-vars */
    //   curl.setOpt(Curl.option.DEBUGFUNCTION, (infoType, contentBuffer) => {
    //     // console.log("DEBUG FUNCTION", infoType);

    //     switch (infoType) {
    //       case CurlInfoDebug.DataIn:
    //         // console.log("DATA IN", contentBuffer.toString("utf-8"));
    //         return 0;
    //       case CurlInfoDebug.DataOut:
    //         // console.log("DATA OUT", contentBuffer.toString("utf-8"));
    //         return 0;
    //       case CurlInfoDebug.HeaderIn:
    //         // console.log("HEADER IN: ", contentBuffer.toString("utf-8"));
    //         return 0;
    //       case CurlInfoDebug.HeaderOut:
    //         // console.log("HEADER OUT", contentBuffer.toString("utf-8"));
    //         return 0;
    //       case CurlInfoDebug.SslDataIn:
    //         // console.log("SSL DATA IN");
    //         return 0;
    //       case CurlInfoDebug.SslDataOut:
    //         // console.log("SSL DATA OUT");
    //         return 0;
    //       case CurlInfoDebug.Text:
    //         // console.log("TEXT", contentBuffer.toString("utf-8"));
    //         return 0;
    //     }
    //     return 0;
    //     // const content = contentBuffer.toString("utf8");
    //     // const rawName = Object.keys(CurlInfoDebug).find((k) => CurlInfoDebug[k] === infoType) || "";
    //     // const name = LIBCURL_DEBUG_MIGRATION_MAP[rawName] || rawName;

    //     // if (infoType === CurlInfoDebug.SslDataIn || infoType === CurlInfoDebug.SslDataOut) {
    //     //   return 0;
    //     // }

    //     // // Ignore the possibly large data messages
    //     // if (infoType === CurlInfoDebug.DataOut) {
    //     //   if (contentBuffer.length === 0) {
    //     //     // Sometimes this happens, but I'm not sure why. Just ignore it.
    //     //   } else if (contentBuffer.length / 1024 < settings.maxTimelineDataSizeKB) {
    //     //     addTimeline(name, content);
    //     //   } else {
    //     //     addTimeline(name, `(${describeByteSize(contentBuffer.length)} hidden)`);
    //     //   }

    //     //   return 0;
    //     // }

    //     // if (infoType === CurlInfoDebug.DataIn) {
    //     //   addTimelineText(`Received ${describeByteSize(contentBuffer.length)} chunk`);
    //     //   return 0;
    //     // }

    //     // // Don't show cookie setting because this will display every domain in the jar
    //     // if (infoType === CurlInfoDebug.Text && content.indexOf("Added cookie") === 0) {
    //     //   return 0;
    //     // }

    //     // addTimeline(name, content);
    //     // return 0; // Must be here
    //   });
    //   /* eslint-enable @typescript-eslint/no-unused-vars */

    //   // curl.setOpt(Curl.option.WRITEFUNCTION, (buff) => {
    //   //   // responseBodyBytes += buff.length;
    //   //   // responseBodyWriteStream.write(buff);
    //   //   console.log("got back: ", buff.length);
    //   //   return buff.length;
    //   // });

    //   // curl.setOpt(Curl.option.WRITEFUNCTION, null);

    //   if (renderedRequest.body?.text) {
    //     curl.setOpt(Curl.option.POSTFIELDS, renderedRequest.body.text);
    //   }

    //   // curl.setOpt(Curl.option.SSL_VERIFYHOST, 0);
    //   // curl.setOpt(Curl.option.SSL_VERIFYPEER, 0);

    //   /* eslint-disable @typescript-eslint/no-unused-vars */
    //   curl.on("end", function (statusCode, data, headers) {
    //     console.log("END");
    //     console.info(statusCode);
    //     console.info("---");
    //     console.info(data.length);
    //     console.info("---");
    //     console.info(this.getInfo("TOTAL_TIME"));

    //     resolve(statusCode);

    //     this.close();
    //   });

    //   curl.on("error", (a, b, c) => {
    //     console.log("ERRR", a, b);
    //     curl.close.bind(curl);
    //   });

    //   const headerStrings = headers
    //     .filter((h) => h.name)
    //     .map((h) => {
    //       const value = h.value || "";

    //       if (value === "") {
    //         // Curl needs a semicolon suffix to send empty header values
    //         return `${h.name};`;
    //         // } else if (value === DISABLE_HEADER_VALUE) {
    //         //   // Tell Curl NOT to send the header if value is null
    //         //   return `${h.name}:`;
    //       } else {
    //         // Send normal header value
    //         return `${h.name}: ${value}`;
    //       }
    //     });
    //   console.log("header strings: ", headerStrings);
    //   curl.setOpt(Curl.option.HTTPHEADER, headerStrings);

    //   /* eslint-enable @typescript-eslint/no-unused-vars */
    //   curl.perform();
    //   console.log("issued request...waiting");
    // });
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

const clearCancelFunctionForId = (requestId: string) => {
  if (hasCancelFunctionForId(requestId)) {
    delete cancelRequestFunctionMap[requestId];
  }
};

const hasCancelFunctionForId = (requestId: string) => {
  return cancelRequestFunctionMap.hasOwnProperty(requestId);
};

const storeTimeline = (timeline: ResponseTimelineEntry[]) => {
  return new Promise<string>((resolve, reject) => {
    const timelineStr = JSON.stringify(timeline, null, "\t");
    const timelineHash = createHash("sha1").update(timelineStr).digest("hex");
    const responsesDir = pathJoin(getDataDirectory(), "responses");
    mkdirp.sync(responsesDir);
    const timelinePath = pathJoin(responsesDir, timelineHash + ".timeline");
    fs.writeFile(timelinePath, timelineStr, (err) => {
      if (err != null) {
        reject(err);
      } else {
        resolve(timelinePath);
      }
    });
  });
};

interface HeaderResult {
  headers: ResponseHeader[];
  version: string;
  code: number;
  reason: string;
}

const _parseHeaders = (buffer: Buffer) => {
  const results: HeaderResult[] = [];
  const lines = buffer.toString("utf8").split(/\r?\n|\r/g);

  for (let i = 0, currentResult: HeaderResult | null = null; i < lines.length; i++) {
    const line = lines[i];
    const isEmptyLine = line.trim() === "";

    // If we hit an empty line, start parsing the next response
    if (isEmptyLine && currentResult) {
      results.push(currentResult);
      currentResult = null;
      continue;
    }

    if (!currentResult) {
      const [version, code, ...other] = line.split(/ +/g);
      currentResult = {
        version,
        code: parseInt(code, 10),
        reason: other.join(" "),
        headers: [],
      };
    } else {
      const [name, value] = line.split(/:\s(.+)/);
      const header: ResponseHeader = {
        name,
        value: value || "",
      };
      currentResult.headers.push(header);
    }
  }

  return results;
};

// move to querystring &/or url helper

/**
 * Build a querystring from a list of name/value pairs
 */
export const buildQueryStringFromParams = (
  parameters: { name: string; value?: string }[],

  /** allow empty names and values */
  strict?: boolean
) => {
  strict = strict === undefined ? true : strict;
  const items = [];

  for (const param of parameters) {
    const built = buildQueryParameter(param, strict);

    if (!built) {
      continue;
    }

    items.push(built);
  }

  return items.join("&");
};

export const buildQueryParameter = (
  param: { name?: string; value?: string | number },

  /** allow empty names and values */
  strict?: boolean
) => {
  strict = strict === undefined ? true : strict;

  // Skip non-name ones in strict mode
  if (strict && !param.name) {
    return "";
  }

  // Cast number values to strings
  if (typeof param.value === "number") {
    param.value = String(param.value);
  }

  if (!strict || param.value) {
    // Don't encode ',' in values
    const value = flexibleEncodeComponent(param.value || "").replace(/%2C/gi, ",");
    const name = flexibleEncodeComponent(param.name || "");

    return `${name}=${value}`;
  } else {
    return flexibleEncodeComponent(param.name);
  }
};

const ESCAPE_REGEX_MATCH = /[-[\]/{}()*+?.\\^$|]/g;

export const flexibleEncodeComponent = (str = "", ignore = "") => {
  // Sometimes spaces screw things up because of url.parse
  str = str.replace(/%20/g, " ");

  // Handle all already-encoded characters so we don't touch them
  str = str.replace(/%([0-9a-fA-F]{2})/g, "__ENC__$1");

  // Do a special encode of ignored chars, so they aren't touched.
  // This first pass, surrounds them with a special tag (anything unique
  // will work), so it can change them back later
  // Example: will replace %40 with __LEAVE_40_LEAVE__, and we'll change
  // it back to %40 at the end.
  for (const c of ignore) {
    const code = encodeURIComponent(c).replace("%", "");
    const escaped = c.replace(ESCAPE_REGEX_MATCH, "\\$&");
    const re2 = new RegExp(escaped, "g");
    str = str.replace(re2, `__RAW__${code}`);
  }

  // Encode it
  str = encodeURIComponent(str);

  // Put back the raw version of the ignored chars
  for (const match of str.match(/__RAW__([0-9a-fA-F]{2})/g) || []) {
    const code = match.replace("__RAW__", "");
    str = str.replace(match, decodeURIComponent(`%${code}`));
  }

  // Put back the encoded version of the ignored chars
  for (const match of str.match(/__ENC__([0-9a-fA-F]{2})/g) || []) {
    const code = match.replace("__ENC__", "");
    str = str.replace(match, `%${code}`);
  }

  return str;
};

export const getJoiner = (url: string) => {
  url = url || "";
  return url.indexOf("?") === -1 ? "?" : "&";
};

/**
 * Join querystring to URL
 */
export const joinUrlAndQueryString = (url: string, qs: string) => {
  if (!qs) {
    return url;
  }

  if (!url) {
    return qs;
  }

  const [base, ...hashes] = url.split("#");

  // TODO: Make this work with URLs that have a #hash component
  const baseUrl = base || "";
  const joiner = getJoiner(base);
  const hash = hashes.length ? `#${hashes.join("#")}` : "";
  return `${baseUrl}${joiner}${qs}${hash}`;
};

/**
 * Set a default protocol for a URL
 * @param url URL to set protocol on
 * @param [defaultProto='http:'] default protocol
 */
export const setDefaultProtocol = (url: string, defaultProto?: string) => {
  const trimmedUrl = url.trim();
  defaultProto = defaultProto || "http:";

  // If no url, don't bother returning anything
  if (!trimmedUrl) {
    return "";
  }

  // Default the proto if it doesn't exist
  if (trimmedUrl.indexOf("://") === -1) {
    return `${defaultProto}//${trimmedUrl}`;
  }

  return trimmedUrl;
};

/** see list of allowed characters https://datatracker.ietf.org/doc/html/rfc3986#section-2.2 */
const RFC_3986_GENERAL_DELIMITERS = ":@"; // (unintentionally?) missing: /?#[]

/** see list of allowed characters https://datatracker.ietf.org/doc/html/rfc3986#section-2.2 */
const RFC_3986_SUB_DELIMITERS = "$+,;="; // (unintentionally?) missing: !&'()*

/** see list of allowed characters https://datatracker.ietf.org/doc/html/rfc3986#section-2.2 */
const URL_PATH_CHARACTER_WHITELIST = `${RFC_3986_GENERAL_DELIMITERS}${RFC_3986_SUB_DELIMITERS}`;

/**
 * Automatically encode the path and querystring components
 * @param url url to encode
 * @param encode enable encoding
 */
export const smartEncodeUrl = (url: string, encode?: boolean) => {
  // Default autoEncode = true if not passed
  encode = encode === undefined ? true : encode;

  const urlWithProto = setDefaultProtocol(url);

  if (!encode) {
    return urlWithProto;
  } else {
    // Parse the URL into components
    // const parsedUrl = new URL(urlWithProto);
    const parsedUrl = urlParse(urlWithProto);

    // ~~~~~~~~~~~ //
    // 1. Pathname //
    // ~~~~~~~~~~~ //

    if (parsedUrl.pathname) {
      const segments = parsedUrl.pathname.split("/");
      parsedUrl.pathname = segments.map((s: any) => flexibleEncodeComponent(s, URL_PATH_CHARACTER_WHITELIST)).join("/");
    }

    // ~~~~~~~~~~~~~~ //
    // 2. Querystring //
    // ~~~~~~~~~~~~~~ //

    if (parsedUrl.query) {
      const qsParams = deconstructQueryStringToParams(parsedUrl.query);
      const encodedQsParams = [];
      for (const { name, value } of qsParams) {
        encodedQsParams.push({
          name: flexibleEncodeComponent(name),
          value: flexibleEncodeComponent(value),
        });
      }

      parsedUrl.query = buildQueryStringFromParams(encodedQsParams);
      parsedUrl.search = `?${parsedUrl.query}`;
    }

    return urlFormat(parsedUrl);
  }
};

export async function waitForStreamToFinish(stream: Readable | Writable) {
  return new Promise<void>((resolve) => {
    // @ts-expect-error -- access of internal values that are intended to be private.  We should _not_ do this.
    if (stream._readableState?.finished) {
      return resolve();
    }

    // @ts-expect-error -- access of internal values that are intended to be private.  We should _not_ do this.
    if (stream._writableState?.finished) {
      return resolve();
    }

    stream.on("close", () => {
      resolve();
    });
    stream.on("error", () => {
      resolve();
    });
  });
}

/**
 * Deconstruct a querystring to name/value pairs
 * @param [qs] {string}
 * @param [strict=true] {boolean} - allow empty names and values
 * @returns {{name: string, value: string}[]}
 */
export const deconstructQueryStringToParams = (
  qs: string,

  /** allow empty names and values */
  strict?: boolean
) => {
  strict = strict === undefined ? true : strict;
  const pairs: { name: string; value: string }[] = [];

  if (!qs) {
    return pairs;
  }

  const stringPairs = qs.split("&");

  for (const stringPair of stringPairs) {
    // NOTE: This only splits on first equals sign. '1=2=3' --> ['1', '2=3']
    const [encodedName, ...encodedValues] = stringPair.split("=");
    const encodedValue = encodedValues.join("=");

    let name = "";
    try {
      name = decodeURIComponent(encodedName || "");
    } catch (e) {
      // Just leave it
      name = encodedName;
    }

    let value = "";
    try {
      value = decodeURIComponent(encodedValue || "");
    } catch (e) {
      // Just leave it
      value = encodedValue;
    }

    if (strict && !name) {
      continue;
    }

    pairs.push({ name, value });
  }

  return pairs;
};

// move to fmt helper

export const describeByteSize = (bytes: number, long = false) => {
  bytes = Math.round(bytes * 10) / 10;
  let size;
  // NOTE: We multiply these by 2 so we don't end up with
  // values like 0 GB
  let unit;

  if (bytes < 1024 * 2) {
    size = bytes;
    unit = long ? "bytes" : "B";
  } else if (bytes < 1024 * 1024 * 2) {
    size = bytes / 1024;
    unit = long ? "kilobytes" : "KB";
  } else if (bytes < 1024 * 1024 * 1024 * 2) {
    size = bytes / 1024 / 1024;
    unit = long ? "megabytes" : "MB";
  } else {
    size = bytes / 1024 / 1024 / 1024;
    unit = long ? "gigabytes" : "GB";
  }

  const rounded = Math.round(size * 10) / 10;
  return `${rounded} ${unit}`;
};
