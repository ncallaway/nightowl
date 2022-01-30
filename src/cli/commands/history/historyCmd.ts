import { history } from "../../../core";
import { printResponseUtil } from "../../lib/print/printResponseUtil";
import { storeUtil } from "../../lib/storeUtil";
import { Command } from "../command";

const run = async (): Promise<void> => {
  const res = await storeUtil.useStore(async (store) => history.getRequests(store));

  if (res.isErr()) {
    console.log(`Failed to fetch requests: (${res.error})`);
    process.exit(1);
  }
  const requests = res.value;

  printResponseUtil.printSummaryTable(requests);
};

export const HistoryCommand: Command = {
  name: "history",
  options: [],
  run,
};
