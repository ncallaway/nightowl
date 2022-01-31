import { CommandLineOptions } from "command-line-args";
import { colorUtil } from "./print/colorUtil";

let color = false;
let json = false;
let plain = true;

const set = (args: CommandLineOptions) => {
  setColor(!colorUtil.noColor(args));
  setJson(args.json);
  setPlain(args.plain);
};

const setColor = (allowColor: boolean) => {
  color = allowColor;
};

const setJson = (allowJson: boolean) => {
  json = allowJson;
};

const setPlain = (allowPlain: boolean) => {
  plain = allowPlain;
};

export const globals = {
  set,
  get color() {
    return color;
  },
  get json() {
    return json;
  },

  get plain() {
    return plain;
  },
};

export const g = globals;
