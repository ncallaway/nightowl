import { RequestHeader } from "../insomniaTypes";

export const getBasicAuthHeader = (username?: string | null, password?: string | null, encoding = "utf8") => {
  const name = "Authorization";
  const header = `${username || ""}:${password || ""}`;
  // @ts-expect-error -- TSCONVERSION appears to be a genuine error
  const authString = Buffer.from(header, encoding).toString("base64");
  const value = `Basic ${authString}`;
  const requestHeader: RequestHeader = {
    name,
    value,
  };
  return requestHeader;
};

export const getBearerAuthHeader = (token: string, prefix: string) => {
  const name = "Authorization";
  const value = `${prefix || "Bearer"} ${token}`;
  const requestHeader: RequestHeader = {
    name,
    value,
  };
  return requestHeader;
};
