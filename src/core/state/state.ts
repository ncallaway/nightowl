import _ from "lodash";
import { err, ok, Result } from "neverthrow";
import { envLib as envLib } from "../env/env";
import { dbstore } from "../store/dbstore";
import { OwlStore, State, StateSummary, UnknownObject } from "../types";

const validStateCharsRegex = /^[A-Za-z0-9][A-Za-z0-9_\-:]*$/;
const isValidStateName = (state: string): boolean => {
  const isTrimmed = state == state.trim();
  const isValidChars = validStateCharsRegex.test(state);
  return isTrimmed && isValidChars;
};

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

const stateOrDefault = (state: string | undefined): Result<string, string> => {
  if (state) {
    if (!isValidStateName(state)) {
      return err(`${state} is not a valid state name`);
    }
    return ok(state);
  }

  return ok("default");
};

const get = async (
  state: string | undefined,
  env: string | undefined,
  store: OwlStore
): Promise<Result<State, string>> => {
  const resState = stateOrDefault(state);
  if (resState.isErr()) {
    return err(resState.error);
  }
  state = resState.value;

  const resEnv = await envLib.envOrDefault(env);
  if (resEnv.isErr()) {
    return err(resEnv.error);
  }
  env = resEnv.value;

  const loaded: State = (await dbstore.getState(store.db, state, env)) || {
    name: state,
    env: env,
    value: {},
    cookies: {},
  };
  return ok(loaded);
};

const clear = async (
  state: string | undefined,
  env: string | undefined,
  store: OwlStore
): Promise<Result<null, string>> => {
  const resState = stateOrDefault(state);
  if (resState.isErr()) {
    return err(resState.error);
  }
  state = resState.value;

  const resEnv = await envLib.envOrDefault(env);
  if (resEnv.isErr()) {
    return err(resEnv.error);
  }
  env = resEnv.value;

  await dbstore.deleteState(store.db, state, env);
  return ok(null);
};

const update = async (
  state: string | undefined,
  env: string | undefined,
  values: UnknownObject,
  store: OwlStore,
  merge = false
): Promise<Result<State, string>> => {
  const resState = stateOrDefault(state);
  if (resState.isErr()) {
    return err(resState.error);
  }
  state = resState.value;

  const resEnv = await envLib.envOrDefault(env);
  if (resEnv.isErr()) {
    return err(resEnv.error);
  }
  env = resEnv.value;

  const baseRes = await get(state, env, store);
  if (baseRes.isErr()) {
    return err(baseRes.error);
  }
  const base = baseRes.value;

  if (!merge) {
    base.value = {};
  }

  // todo: .assign doesn't do a deep merge the way we will probably want it to,
  // but .merge doesn't handle `undefined` values the way we want it to. This will
  // probably need to be replaced with a custom implementation.
  const updatedValues = _.assign({}, base.value, values);

  const updated: State = {
    name: state,
    env,
    value: updatedValues,
    cookies: base.cookies,
  };

  await dbstore.saveState(store.db, updated);

  return ok(updated);
};

const move = async (
  state: string | undefined,
  toState: string | undefined,
  env: string | undefined,
  toEnv: string | undefined,
  store: OwlStore
): Promise<Result<null, string>> => {
  const resState = stateOrDefault(state);
  if (resState.isErr()) {
    return err(resState.error);
  }
  state = resState.value;
  const resToState = stateOrDefault(toState);
  if (resToState.isErr()) {
    return err(resToState.error);
  }
  toState = resToState.value;

  const resEnv = await envLib.envOrDefault(env);
  if (resEnv.isErr()) {
    return err(resEnv.error);
  }
  env = resEnv.value;
  const resToEnv = await envLib.envOrDefault(toEnv);
  if (resToEnv.isErr()) {
    return err(resToEnv.error);
  }
  toEnv = resToEnv.value;

  await dbstore.moveState(store.db, state, toState, env, toEnv);
  return ok(null);
};

const copy = async (
  state: string | undefined,
  toState: string | undefined,
  env: string | undefined,
  toEnv: string | undefined,
  store: OwlStore
): Promise<Result<null, string>> => {
  const resState = stateOrDefault(state);
  if (resState.isErr()) {
    return err(resState.error);
  }
  state = resState.value;
  const resToState = stateOrDefault(toState);
  if (resToState.isErr()) {
    return err(resToState.error);
  }
  toState = resToState.value;

  const resEnv = await envLib.envOrDefault(env);
  if (resEnv.isErr()) {
    return err(resEnv.error);
  }
  env = resEnv.value;
  const resToEnv = await envLib.envOrDefault(toEnv);
  if (resToEnv.isErr()) {
    return err(resToEnv.error);
  }
  toEnv = resToEnv.value;

  await dbstore.copyState(store.db, state, toState, env, toEnv);
  return ok(null);
};

export const stateLib = {
  listSummary,
  get,
  update,
  clear,
  move,
  copy,
  isValidStateName,
};
