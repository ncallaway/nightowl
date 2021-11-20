interface Header {
  name: string;
  value: string;
}

export function filterHeaders<T extends Header>(headers: T[], name?: string): T[] {
  if (!Array.isArray(headers) || !name || typeof name !== "string") {
    return [];
  }

  return headers.filter((header) => {
    // Never match against invalid headers
    if (!header || !header.name || typeof header.name !== "string") {
      return false;
    }

    return header.name.toLowerCase() === name.toLowerCase();
  });
}

export function hasContentTypeHeader<T extends Header>(headers: T[]) {
  return filterHeaders(headers, "content-type").length > 0;
}

export function hasContentLengthHeader<T extends Header>(headers: T[]) {
  return filterHeaders(headers, "content-length").length > 0;
}

export function hasAuthHeader<T extends Header>(headers: T[]) {
  return filterHeaders(headers, "authorization").length > 0;
}

export function hasAcceptHeader<T extends Header>(headers: T[]) {
  return filterHeaders(headers, "accept").length > 0;
}

export function hasUserAgentHeader<T extends Header>(headers: T[]) {
  return filterHeaders(headers, "user-agent").length > 0;
}

export function hasAcceptEncodingHeader<T extends Header>(headers: T[]) {
  return filterHeaders(headers, "accept-encoding").length > 0;
}

export function getSetCookieHeaders<T extends Header>(headers: T[]): T[] {
  return filterHeaders(headers, "set-cookie");
}

export function getLocationHeader<T extends Header>(headers: T[]): T | null {
  const matches = filterHeaders(headers, "location");
  return matches.length ? matches[0] : null;
}

export function getContentTypeHeader<T extends Header>(headers: T[]): T | null {
  const matches = filterHeaders(headers, "content-type");
  return matches.length ? matches[0] : null;
}

export function getMethodOverrideHeader<T extends Header>(headers: T[]): T | null {
  const matches = filterHeaders(headers, "x-http-method-override");
  return matches.length ? matches[0] : null;
}

export function getHostHeader<T extends Header>(headers: T[]): T | null {
  const matches = filterHeaders(headers, "host");
  return matches.length ? matches[0] : null;
}

export function getContentDispositionHeader<T extends Header>(headers: T[]): T | null {
  const matches = filterHeaders(headers, "content-disposition");
  return matches.length ? matches[0] : null;
}

export function getContentLengthHeader<T extends Header>(headers: T[]): T | null {
  const matches = filterHeaders(headers, "content-length");
  return matches.length ? matches[0] : null;
}
