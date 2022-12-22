import { CommandLineOptions } from "command-line-args";
import { colorUtil } from "./print/colorUtil";

let color = false;
let json = false;
let plain = true;
let help = false;

const set = (args: CommandLineOptions) => {
  setColor(!colorUtil.noColor(args));
  setJson(args.json);
  setPlain(args.plain);
  setHelp(args.help);
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

const setHelp = (showHelp: boolean) => {
  help = showHelp;
};

export const globals = {
  set,
  get color(): boolean { return color; },
  get json(): boolean { return json; },
  get plain(): boolean { return plain; },
  get help(): boolean { return help; },
};

export const g = globals;
