import { CommandLineOptions } from "command-line-args";
import _ from "lodash";

/**
 * Attempt to parse an argument shaped like: '{"foo": 5}'
 */
const tryParseAsJson = (arg: string, target: Record<string, unknown>): boolean => {
  try {
    const json = JSON.parse(arg);
    _.merge(target, json);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Attempt to parse an argument shaped like: 'foo=5'
 */
const tryParseAsAssignment = (arg: string, target: Record<string, unknown>): boolean => {
  const equalsIdx = arg.indexOf("=");
  if (equalsIdx > 0 && equalsIdx < arg.length) {
    const path = arg.slice(0, equalsIdx);
    const val = arg.slice(equalsIdx + 1);
    try {
      const jsonVal = JSON.parse(val);
      const op = _.set({}, path, jsonVal);

      _.merge(target, op);
      return true;
    } catch (err) {
      const op = _.set({}, path, val);

      _.merge(target, op);
      return true;
    }
  }
  return false;
};

const parseArg = (arg: string, target: Record<string, unknown>): boolean => {
  // first attempt to parse as json
  let parsed = tryParseAsJson(arg, target);

  // next try processing as a '=' string
  if (!parsed) {
    parsed = tryParseAsAssignment(arg, target);
  }

  return parsed;
};


type EnvPutPatchArgs = {
  values: any;
  privates: any;
};

const parseEnvPutPatchArgs = (args: CommandLineOptions): EnvPutPatchArgs => {
  const values: any = {};
  const privates: any = {};

  if (args._unknown) {
    for (const arg of args._unknown) {
      parseArg(arg, values);
    }
  }

  if (args.private) {
    for (const arg of args.private) {
      parseArg(arg, privates);
    }
  }

  if (args.unset) {
    for (const arg of args.unset) {
      const op = _.set({}, arg, undefined);
      _.merge(values, op);
      _.merge(privates, op);
    }
  }

  return {
    values,
    privates,
  };
};

export const envArgsUtil = {
  parseEnvPutPatchArgs,
};
