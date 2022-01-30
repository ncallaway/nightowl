// designed to be compatible with insomnia Request (https://github.com/Kong/insomnia/blob/9353a6fb00782e2e5b8adb417f8c58f6d8e53224/packages/insomnia-app/app/models/request.ts#L96)

import { Temporal } from "@js-temporal/polyfill";
import { CookieJar } from "tough-cookie";

export type RequestAuthentication = Record<string, any>;

export interface RequestHeader {
  name: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

export interface RequestParameter {
  name: string;
  value: string;
  disabled?: boolean;
  id?: string;
  fileName?: string;
}

export interface RequestBodyParameter {
  name: string;
  value: string;
  description?: string;
  disabled?: boolean;
  multiline?: string;
  id?: string;
  fileName?: string;
  type?: string;
}

export interface RequestBody {
  mimeType?: string | null;
  text?: string;
  fileName?: string;
  params?: RequestBodyParameter[];

  // nightowl additions
  json?: Record<string, unknown>;
}

export interface RequestPrompts {
  key: string;
  description?: string;
}

export interface RequestDefinition {
  _key: string;
  url: string;
  description: string;
  method: string;
  body: RequestBody;
  parameters: RequestParameter[];
  headers: RequestHeader[];
  authentication: RequestAuthentication;
  metaSortKey: number;
  isPrivate: boolean;
  // Settings
  settingStoreCookies: boolean;
  settingSendCookies: boolean;
  settingDisableRenderRequestBody: boolean;
  settingEncodeUrl: boolean;
  settingRebuildPath: boolean;
  settingFollowRedirects: "on" | "off" | "global";

  // nightowl additions
  prompts: RequestPrompts[];
}

export type RenderedRequest = RequestDefinition & {
  _id: string;
  cookies: {
    name: string;
    value: string;
    disabled?: boolean;
  }[];
  cookieJar: CookieJar;
};

export interface ResponseHeader {
  name: string;
  value: string;
}

export interface ResponsePatch {
  key: string;
  parentId: string;
  bodyCompression?: "zip" | null;
  bodyPath?: string;
  bytesContent?: number;
  bytesRead?: number;
  contentType?: string;
  elapsedTime: number;
  environmentId?: string | null;
  error?: string;
  headers?: ResponseHeader[];
  httpVersion?: string;
  message?: string;
  settingSendCookies?: boolean;
  settingStoreCookies?: boolean;
  statusCode?: number;
  statusMessage?: string;
  timelinePath?: string;
  method: string;
  url: string;
  sentAt: Temporal.Instant;

  // nightowl addition
  requestHeaders?: ResponseHeader[];
}

export interface ResponseTimelineEntry {
  name: string;
  timestamp: number;
  value: string;
}