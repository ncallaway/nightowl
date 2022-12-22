import { colorUtil } from "./colorUtil";
import { ResponsePatch } from "../../../core/insomniaTypes";

const statusMessage = (r: ResponsePatch): string => {
  const message = [r.statusCode, r.statusMessage].filter((x) => x).join(" ");
  return colorUtil.chalkStatus(r.statusCode, message);
};

const methurl = (r: ResponsePatch, elide: number | undefined = undefined): string => {
  const method = colorUtil.chalkMethod(r.method, r.method);

  const elidedUrl = elide ? elideMiddle(r.url, elide) : r.url;

  return [method, elidedUrl].filter((x) => x).join(" ");
};

export const formatUtil = {
  statusMessage,
  methurl,
};

const elideMiddle = (str: string, n = 100) => {
  if (str.length < n - 1) {
    return str;
  }

  const mid = (n - 2) / 2;
  const fromlast = str.length - (n - 2) / 2;

  const head = String(str).substring(0, mid);
  const tail = String(str).substring(fromlast);

  return `${head}…${tail}`;
};
