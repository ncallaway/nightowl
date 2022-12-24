import commandLineArgs from "command-line-args";
import { argv } from "process";
import { Commands } from "./commands/command";
import { HelpCommand } from "./commands/utility/helpCmd";
import { VersionCommand } from "./commands/utility/versionCmd";
import { argsUtil } from "./lib/argsUtil";
import { g } from "./lib/globals";

export const main = async (): Promise<void> => {
  // if (argv.length <= 2) {
  //   console.log("need at least 1 argument");
  //   process.exit(1);
  // }

  let args = argv.slice(2);

  /* first - parse global output options */

  const outputOpts = argsUtil.outputArgs();
  const outputArgs = commandLineArgs(outputOpts, { argv: args, partial: true });

  const version = outputArgs.version as boolean;

  args = outputArgs._unknown || [];
  g.set(outputArgs);

  /* second - parse the main command name */
  let cmd = Commands.RootCommand;
  if (version) {
    cmd = VersionCommand;
  } else {
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
  }

  // do a final cli processing for the command
  if (cmd.run) {
    let cmdArgs = {};
    if (cmd.options) {
      cmdArgs = commandLineArgs(cmd.options, { argv: args, stopAtFirstUnknown: true });
    }
    try {
      await cmd.run(cmdArgs);
    } catch (err) {
      console.error("An unexpected error occurred: ", err);
    }
  } else {
    // trap help
    try {
      /* eslint-disable @typescript-eslint/no-extra-non-null-assertion, @typescript-eslint/no-non-null-assertion */
      const helpArgs = commandLineArgs([], { argv: [], stopAtFirstUnknown: true });
      await HelpCommand.run!!(helpArgs);
      /* eslint-enable @typescript-eslint/no-extra-non-null-assertion, @typescript-eslint/no-non-null-assertion */
    } catch (err) {
      console.error("An unexpected error occurred: ", err);
    }
  }
};
