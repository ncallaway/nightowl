import { store } from "../../../core";
import { unwrap } from "../../lib/errors";
import { Command } from "../command";

const initializeOwl = async (): Promise<void> => {
  // check if directory exists, and bail if the directory exists
  await unwrap(store.initializeStore());
}

export const InitCommand: Command = {
  name: "init",
  run: initializeOwl
}