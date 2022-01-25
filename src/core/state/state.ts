import { OwlStore, StateSummary } from "../types";
import { env as envLib } from "../env/env";
import { err, ok, Result } from "neverthrow";
import { dbstore } from "../store/dbstore";

const loadStates = async (env: string, store: OwlStore) => {
  const states = await dbstore.getStatesForEnv(store.db, env);

  if (!states.some((s) => s.name == "default")) {
    states.push({
      name: "default",
      env,
      cookies: {},
      value: {},
    });
  }

  return states.sort((a, b) => a.name.localeCompare(b.name));
};

const listSummary = async (env: string | undefined, store: OwlStore): Promise<Result<StateSummary[], string>> => {
  if (!env) {
    const resEnvStr = await envLib.getActive();
    if (resEnvStr.isErr()) {
      return err(resEnvStr.error);
    }
    env = resEnvStr.value;
  }

  const states = await loadStates(env, store);

  const summaries: StateSummary[] = states.map((s) => ({
    name: s.name,
    env: s.env,
  }));

  return ok(summaries);
};

export const state = {
  listSummary,
};
