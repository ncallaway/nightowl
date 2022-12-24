import fs from 'fs/promises';
import { err, ok, Result } from "neverthrow";
import { files } from "../lib/files";
import { OwlError } from "../errors";
import { owlpaths } from "../lib/owlpaths";
import { dbstore } from "./dbstore";
import { OwlStore } from "../types";
import { randomUUID } from 'crypto';

const inspectStore = async (): Promise<Result<undefined, OwlError>> => {
  // ensure that the .owl directory exists
  try {
    const dir = await fs.opendir(owlpaths.workspaceDir());
    await dir.close();
  } catch (error) {
    return err({ error: "err-owldir-not-found" });
  }

  // ensure that the .owl/.config file exists
  try {
    const config = await fs.open(owlpaths.workspaceConfigPath(), 'r');
    await config.close();
  } catch (error) {
    return err({ error: "err-owldir-not-recognized", detail: ".config file was not found or could not be read." });
  }

  // ensure that the .owl/.env/.config file exists
  try {
    const envConfig = await fs.open(owlpaths.envConfigPath(), 'r');
    await envConfig.close();
  } catch (error) {
    return err({ error: "err-owldir-not-recognized", detail: ".env/.config file was not found or could not be read." });
  }

  return ok(undefined);
}

const initializeStore = async (): Promise<Result<undefined, OwlError>> => {
  try {
    await fs.mkdir(owlpaths.workspaceDir(), { recursive: false })
  } catch (error) {
    return err({ error: "err-owldir-already-exists" });
  }

  try {
    await fs.mkdir(owlpaths.envDir(), { recursive: true })
  } catch (error) {
    return err({ error: "err-writing-owldir", detail: error as Error });
  }

  const key = randomUUID();
  const fileRes = await files.writeJson(owlpaths.workspaceConfigPath(), { key }, { pretty: true });
  if (fileRes.isErr()) {
    return err({ error: "err-writing-owldir", detail: `error while writing ${owlpaths.workspaceConfigPath()}: ${fileRes.error}` });
  }


  const envRes = await files.writeJson(owlpaths.envConfigPath(), { default: "local" }, { pretty: true });
  if (envRes.isErr()) {
    return err({ error: "err-writing-owldir", detail: `error while writing ${owlpaths.envConfigPath()}: ${envRes.error}` });
  }

  const localEnvRes = await files.writeJson(owlpaths.envPath("local"), { values: {}, private: [] }, { pretty: true });
  if (localEnvRes.isErr()) {
    return err({ error: "err-writing-owldir", detail: `error while writing ${owlpaths.envPath("local")}: ${localEnvRes.error}` });
  }

  return ok(undefined);
}

const openStore = async (): Promise<Result<OwlStore, OwlError>> => {
  // load the workspace config...
  const resWsConfig = await files.readJson(owlpaths.workspaceConfigPath(), undefined, {});
  if (resWsConfig.isErr()) {
    return err({...resWsConfig.error, error: "err-owldir-not-recognized"} );
  }
  const wsConfig = resWsConfig.value as any;
  const key = wsConfig.key;

  const db = await dbstore.openDatabase(key);

  return ok({ db });
};

const closeStore = async (store: OwlStore): Promise<void> => {
  await dbstore.closeDatabase(store.db);
};

export const store = { inspectStore, initializeStore, openStore, closeStore };
