import { store } from "../../core";
import { OwlStore } from "../../core/types";
import { unwrap } from "./errors";


const ensureStore = async (): Promise<void> => {
  const resInspect = await store.inspectStore();
  unwrap(resInspect);
}

const useStore = async <T>(fn: (store: OwlStore) => Promise<T>): Promise<T> => {
  await ensureStore();

  const resOwlStore = await store.openStore();
  if (resOwlStore.isErr()) {
    console.error(`\nFailed to open the data store (${resOwlStore.error})`);
    process.exit(1);
  }
  const owlStore = resOwlStore.value;

  const result = await fn(owlStore);

  await store.closeStore(owlStore);

  return result;
};

export const storeUtil = {
  ensureStore,
  useStore,
};
