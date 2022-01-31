import { CommandLineOptions } from "command-line-args";
import { history } from "../../../core";
import { ResponsePatch } from "../../../core/insomniaTypes";
import { argsUtil } from "../../lib/argsUtil";
import { printResponseUtil } from "../../lib/print/printResponseUtil";
import { storeUtil } from "../../lib/storeUtil";
import { Command } from "../command";

const run = async (args: CommandLineOptions): Promise<void> => {
  const res = await storeUtil.useStore(async (store) => history.getRequests(store));

  if (res.isErr()) {
    console.log(`Failed to fetch requests: (${res.error})`);
    process.exit(1);
  }
  const requests = res.value;

  let request: ResponsePatch | undefined = undefined;
  // first get by index
  if (Number.isInteger(Number(args.which))) {
    const idx = Number(args.which);
    if (idx >= 1 && idx <= requests.length) {
      request = requests[idx - 1];
    }
  }

  if (!request) {
    request = requests.find((r) => r.parentId == args.which);
  }

  if (!request) {
    console.log(`Could not find request for: ${args.which}`);
    process.exit(1);
  }

  const options = printResponseUtil.printOptionsFromArgs(args);

  await printResponseUtil.print(request, options);
};

export const ShowCommand: Command = {
  name: "show",
  options: [{ name: "which", defaultOption: true }, ...argsUtil.printOptionsArgs()],
  run,
};
