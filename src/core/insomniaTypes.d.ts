// designed to be compatible
export interface RequestDefinition {
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
}

export type RenderedRequest = RequestDefinition & {
  cookies: {
    name: string;
    values: string;
    disabled?: boolean;
  }[];
  cookieJar: any;
};