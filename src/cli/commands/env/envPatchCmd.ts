import { CommandLineOptions } from "command-line-args";
import _ from "lodash";
import { env } from "../../../core";
import { Command } from "../command";

export const run = async (args: CommandLineOptions): Promise<void> => {
  console.log("PATCH CMD");
  if (!args.env) {
    console.log("the new environment name must be provided");
    process.exit(1);
  }

  console.log("ALL ARGS: ", args);

  const obj = {};

  if (args._unknown) {
    for (const arg of args._unknown) {
      console.log("handling arg: ", arg);
      // first try parsing the arg as json
      let wasJson = false;
      try {
        const json = JSON.parse(arg);
        console.log("was json: ", json);
        _.merge(obj, json);
        wasJson = true;
      } catch (err) {
        wasJson = false;
        console.log("was not json...");
      }

      // next try processing as a '=' string
      if (!wasJson) {
        const equalsIdx = arg.indexOf("=");
        if (equalsIdx > 0 && equalsIdx < arg.length) {
          const path = arg.slice(0, equalsIdx);
          const val = arg.slice(equalsIdx + 1);

          console.log("got path and val: ", path, val);
          try {
            const jsonVal = JSON.parse(val);
            const op = _.set({}, path, jsonVal);

            _.merge(obj, op);
          } catch (err) {
            console.log("couldn't parse value as json, either");
            const op = _.set({}, path, val);

            _.merge(obj, op);
          }
        }
      }
    }
  }

  if (args.unset) {
    for (const arg of args.unset) {
      const op = _.set({}, arg, undefined);
      _.merge(obj, op);
    }
  }

  console.log("produced obj: ", obj);

  const updateRes = await env.update(args.env, obj, true);
  if (updateRes.isErr()) {
    console.error(`\nCannot update environment (${updateRes.error})`);
    process.exit(1);
  }
};

export const EnvPatchCommand: Command = {
  name: "patch",
  options: [
    { name: "env", defaultOption: true },
    { name: "unset", alias: "u", multiple: true },
  ],
  run,
};
