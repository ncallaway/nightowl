import { owlpaths } from "../lib/owlpaths";
import path from "path";
import knex, { Knex } from "knex";
import { ResponsePatch } from "../insomniaTypes";
import { State } from "../types";
import { Temporal } from "@js-temporal/polyfill";
import { types } from "pg";
import { builtins } from "pg-types";

const nullParser = (val: string) => {
  if (val) {
    return Temporal.PlainDate.from(val);
  }
};
types.setTypeParser(builtins.DATE as any, nullParser);
types.setTypeParser(builtins.TIMESTAMP as any, nullParser);
types.setTypeParser(builtins.TIMESTAMPTZ as any, nullParser);
types.setTypeParser(builtins.TIME as any, nullParser);
types.setTypeParser(builtins.TIMETZ as any, nullParser);

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

const getResponses = async (db: Knex, max: number): Promise<ResponsePatch[]> => {
  const rows = await db("requests").select<ResponseRow[]>("*").orderBy("sent_at", "desc").limit(max);
  return rows.map(rowToResponse);
};

const saveState = async (db: Knex, state: State): Promise<void> => {
  const row = stateToRow(state);
  await db("states").insert(row).onConflict(["name", "env"]).merge();
};

const getState = async (db: Knex, state: string, env: string): Promise<State | undefined> => {
  const rows = await db.select("*").from<StateRow>("states").where("name", "=", state).where("env", "=", env).limit(1);
  if (rows && rows.length) {
    return rowToState(rows[0]);
  }
};

const deleteState = async (db: Knex, state: string, env: string): Promise<void> => {
  await db("states").where("name", "=", state).where("env", "=", env).del();
};

const moveState = async (db: Knex, state: string, toState: string, env: string, toEnv: string): Promise<void> => {
  await db("states").where("name", "=", state).where("env", "=", env).update({
    name: toState,
    env: toEnv,
  });
};

const copyState = async (db: Knex, state: string, toState: string, env: string, toEnv: string): Promise<void> => {
  await db.raw(
    "insert into states (name, env, value_json, cookies_json) SELECT ? as name, ? as env, value_json, cookies_json FROM states WHERE name = ? AND env = ?",
    [toState, toEnv, state, env]
  );
};

const getStatesForEnv = async (db: Knex, env: string): Promise<State[]> => {
  const rows = await db.select("*").from<StateRow>("states").where("env", "=", env);
  return rows.map(rowToState);
};

const closeDatabase = async (db: Knex): Promise<void> => {
  await db.destroy();
};

export const dbstore = {
  openDatabase,
  saveResponse,
  getResponses,
  saveState,
  getState,
  getStatesForEnv,
  deleteState,
  moveState,
  copyState,
  closeDatabase,
};

const stateToRow = (state: State): StateRow => {
  return {
    name: state.name,
    env: state.env,
    value_json: JSON.stringify(state.value),
    cookies_json: JSON.stringify(state.cookies),
  };
};

const rowToState = (row: StateRow): State => {
  return {
    name: row.name,
    env: row.env,
    value: parseOr(row.value_json, {}),
    cookies: parseOr(row.cookies_json, {}),
  };
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
    request_headers_json: response.requestHeaders ? JSON.stringify(response.requestHeaders) : "[]",
    http_version: response.httpVersion,
    message: response.message,
    setting_send_cookies: response.settingSendCookies,
    settings_store_cookies: response.settingStoreCookies,
    status_code: response.statusCode,
    status_message: response.statusMessage,
    timeline_path: response.timelinePath,
    url: response.url,
    method: response.method,
    sent_at: response.sentAt.toString(),
  };
};

const rowToResponse = (row: ResponseRow): ResponsePatch => {
  return {
    parentId: row.request_id,
    key: row.request_key,
    bodyCompression: row.body_compression as "zip" | null | undefined,
    bodyPath: row.body_path,
    bytesContent: row.bytes_content,
    bytesRead: row.bytes_read,
    contentType: row.content_type,
    elapsedTime: row.elapsed_time,
    error: row.error,
    headers: row.headers_json ? JSON.parse(row.headers_json) : [],
    requestHeaders: row.request_headers_json ? JSON.parse(row.request_headers_json) : [],
    httpVersion: row.http_version,
    message: row.message,
    settingSendCookies: row.setting_send_cookies,
    settingStoreCookies: row.settings_store_cookies,
    statusCode: row.status_code,
    statusMessage: row.status_message,
    timelinePath: row.timeline_path,
    url: row.url,
    method: row.method,
    sentAt: row.sent_at ? Temporal.Instant.from(row.sent_at) : Temporal.Instant.from("2021-01-01T00:00:00Z"),
  };
};

const parseOr = (json: string, def: any) => {
  if (!json) {
    return def;
  }

  try {
    return JSON.parse(json);
  } catch (err) {
    return def;
  }
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
  request_headers_json?: string;
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
  sent_at?: string;
};

type StateRow = {
  name: string;
  env: string;
  value_json: string;
  cookies_json: string;
};