import { readFile } from "fs/promises";
import _ from "lodash";
import nunjucks from "nunjucks";
import path from "path";
import { argv } from "process";
import { RequestDefinition } from "../core";
import { RenderedRequest } from "../core/insomniaTypes";
import { Network } from "../core/network";
import { State } from "../core/types";

import commandLineArgs from "command-line-args";
import { Commands } from "./commands/command";

export const main = async (): Promise<void> => {
  if (argv.length <= 2) {
    console.log("need at least 1 argument");
    process.exit(1);
  }

  let args = argv.slice(2);
  /* first - parse the main command name */

  let cmd = Commands.RootCommand;
  const mainDefinitions = [{ name: "cmd", defaultOption: true }];

  while (cmd.subcommands) {
    const cmdArgs = commandLineArgs(mainDefinitions, { argv: args, stopAtFirstUnknown: true });
    args = cmdArgs._unknown || [];

    let child = Commands.getExplicitChildCommand(cmd, cmdArgs.cmd);
    if (!child) {
      // if the cmd arg wasn't recognized as an explicit cmd, push it back into the remaining args,
      // list in case it's an argument for something else. Then try and get the default command
      if (cmdArgs.cmd) {
        args.unshift(cmdArgs.cmd);
      }
      child = Commands.getChildCommand(cmd, cmdArgs.cmd);
    }

    if (child) {
      cmd = child;
    } else {
      break;
    }
  }

  // do a final cli processing for the command

  if (cmd.run) {
    let cmdArgs = {};
    if (cmd.options) {
      cmdArgs = commandLineArgs(cmd.options, { argv: args, stopAtFirstUnknown: true });
    }
    cmd.run(cmdArgs);
  } else {
    console.log("(no-run for cmd) ", cmd);
  }
};


