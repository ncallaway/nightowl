import { err, ok, Result } from "neverthrow";
import { files } from "../lib/files";
import { owlpaths } from "../lib/owlpaths";
import { dbstore } from "./dbstore";
import { OwlStore } from "../types";

const openStore = async (): Promise<Result<OwlStore, string>> => {
  // load the workspace config...
  const resWsConfig = await files.readJson(owlpaths.workspaceConfigPath());
  if (resWsConfig.isErr()) {
    return err(resWsConfig.error);
  }
  const wsConfig = resWsConfig.value as any;
  const key = wsConfig.key;

  const db = await dbstore.openDatabase(key);

  return ok({ db });
};

const closeStore = async (store: OwlStore): Promise<void> => {
  await dbstore.closeDatabase(store.db);
};

export const store = { openStore, closeStore };
