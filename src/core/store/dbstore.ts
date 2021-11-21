import { owlpaths } from "../lib/owlpaths";
import path from "path";
import knex, { Knex } from "knex";
import { ResponsePatch } from "../insomniaTypes";

const openDatabase = async (key: string): Promise<Knex> => {
  const dbPath = owlpaths.databasePath(key);

  const config = {
    client: "sqlite3",
    connection: {
      filename: dbPath,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: path.join(__dirname, "migrations"),
    },
    useNullAsDefault: true,
  };

  const db = knex({
    ...config,
    // debug: logSql,
    // log: {
    //   warn: (message) => {
    //     if (
    //       !message.startsWith(
    //         "sqlite does not support inserting default values. Set the `useNullAsDefault` flag to hide this warning"
    //       )
    //     ) {
    //       logger.warn(message);
    //     }
    //   },
    //   error: (message) => logger.error(message),
    //   deprecate: (message) => logger.warn(message),
    //   debug: (message) => {
    //     const msg = message["0"] || message;
    //     logger.trace(msg);
    //   },
    // },
  });

  await db.migrate.latest();

  return db;
};

const saveResponse = async (db: Knex, response: ResponsePatch): Promise<void> => {
  const row = responseToRow(response);
  await db("requests").insert(row).onConflict(["request_id"]).merge();
};

const closeDatabase = async (db: Knex): Promise<void> => {
  await db.destroy();
};

export const dbstore = {
  openDatabase,
  saveResponse,
  closeDatabase,
};

const responseToRow = (response: ResponsePatch): ResponseRow => {
  return {
    request_id: response.parentId,
    request_key: response.key,
    body_compression: response.bodyCompression as string,
    body_path: response.bodyPath,
    bytes_content: response.bytesContent,
    bytes_read: response.bytesRead,
    content_type: response.contentType,
    elapsed_time: response.elapsedTime,
    error: response.error,
    headers_json: response.headers ? JSON.stringify(response.headers) : "[]",
    http_version: response.httpVersion,
    message: response.message,
    setting_send_cookies: response.settingSendCookies,
    settings_store_cookies: response.settingStoreCookies,
    status_code: response.statusCode,
    status_message: response.statusMessage,
    timeline_path: response.timelinePath,
    url: response.url,
    method: response.method,
  };
};

type ResponseRow = {
  request_id: string;
  request_key: string;
  body_compression?: string;
  body_path?: string;
  bytes_content?: number;
  bytes_read?: number;
  content_type?: string;
  elapsed_time: number;
  // environment?: string;
  error?: string;
  headers_json?: string;
  http_version?: string;
  message?: string;
  // parent_id?: string;
  setting_send_cookies?: boolean;
  settings_store_cookies?: boolean;
  status_code?: number;
  status_message?: string;
  timeline_path?: string;
  url: string;
  method: string;
};
