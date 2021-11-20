// Content Types
export const CONTENT_TYPE_JSON = "application/json";
export const CONTENT_TYPE_PLAINTEXT = "text/plain";
export const CONTENT_TYPE_XML = "application/xml";
export const CONTENT_TYPE_YAML = "text/yaml";
export const CONTENT_TYPE_EDN = "application/edn";
export const CONTENT_TYPE_FORM_URLENCODED = "application/x-www-form-urlencoded";
export const CONTENT_TYPE_FORM_DATA = "multipart/form-data";
export const CONTENT_TYPE_FILE = "application/octet-stream";
export const CONTENT_TYPE_GRAPHQL = "application/graphql";
export const CONTENT_TYPE_OTHER = "";
// const contentTypesMap = {
//   [CONTENT_TYPE_EDN]: ["EDN", "EDN"],
//   [CONTENT_TYPE_FILE]: ["File", "Binary File"],
//   [CONTENT_TYPE_FORM_DATA]: ["Multipart", "Multipart Form"],
//   [CONTENT_TYPE_FORM_URLENCODED]: ["Form", "Form URL Encoded"],
//   [CONTENT_TYPE_GRAPHQL]: ["GraphQL", "GraphQL Query"],
//   [CONTENT_TYPE_JSON]: ["JSON", "JSON"],
//   [CONTENT_TYPE_OTHER]: ["Other", "Other"],
//   [CONTENT_TYPE_PLAINTEXT]: ["Plain", "Plain"],
//   [CONTENT_TYPE_XML]: ["XML", "XML"],
//   [CONTENT_TYPE_YAML]: ["YAML", "YAML"],
// };

// Auth Types
export const AUTH_NONE = "none";
export const AUTH_OAUTH_2 = "oauth2";
export const AUTH_OAUTH_1 = "oauth1";
export const AUTH_BASIC = "basic";
export const AUTH_DIGEST = "digest";
export const AUTH_BEARER = "bearer";
export const AUTH_NTLM = "ntlm";
export const AUTH_HAWK = "hawk";
export const AUTH_AWS_IAM = "iam";
export const AUTH_NETRC = "netrc";
export const AUTH_ASAP = "asap";
export const HAWK_ALGORITHM_SHA256 = "sha256";
export const HAWK_ALGORITHM_SHA1 = "sha1";

// HTTP version codes
export const HttpVersions = {
  V1_0: "V1_0",
  V1_1: "V1_1",
  V2_0: "V2_0",
  v3: "v3",
  default: "default",
} as const;
