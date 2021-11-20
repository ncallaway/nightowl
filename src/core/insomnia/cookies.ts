import { Cookie, CookieJar } from "tough-cookie";

interface CookieJSON {
  [key: string]: any;
}

/**
 * Get a request.jar() from a list of cookie objects
 */
export const jarFromCookies = (cookies: Cookie[]) => {
  let jar: CookieJar;

  try {
    // For some reason, fromJSON modifies `cookies`.
    // Create a copy first just to be sure.
    const copy = JSON.stringify({ cookies });
    jar = CookieJar.fromJSON(copy);
  } catch (e) {
    console.log("[cookies] Failed to initialize cookie jar", e);
    jar = new CookieJar() as CookieJar;
  }

  // @ts-ignore
  jar.rejectPublicSuffixes = false;
  // @ts-ignore
  jar.looseMode = true;

  return jar;
};

/**
 * Get a list of cookie objects from a request.jar()
 */
export const cookiesFromJar = (cookieJar: CookieJar): Promise<CookieJSON[]> => {
  return new Promise((resolve) => {
    // @ts-ignore
    cookieJar.store.getAllCookies((err: any, cookies: any) => {
      if (err) {
        console.warn("Failed to get cookies form jar", err);
        resolve([]);
      } else {
        // NOTE: Perform toJSON so we have a plain JS object instead of Cookie instance
        resolve(cookies.map((cookie: any) => cookie.toJSON()));
      }
    });
  });
};
