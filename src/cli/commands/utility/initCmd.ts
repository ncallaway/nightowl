import { store } from "../../../core";
import { unwrap } from "../../lib/errors";
import { Command } from "../command";

const initializeOwl = async (): Promise<void> => {
  // check if directory exists, and bail if the directory exists
  const res = await store.initializeStore();
  unwrap(res);
}

export const InitCommand: Command = {
  name: "init",
  run: initializeOwl
}