import { UnknownObject } from "../types";

const allKeysForPrivates = (privates: UnknownObject, path = ""): string[] => {
  const topLevelKeys = Object.keys(privates);

  const leafKeys = topLevelKeys
    .filter((key) => typeof privates[key] !== "object")
    .map((k) => (path ? `${path}.${k}` : k));
  const nodeKeys = topLevelKeys.filter((key) => typeof privates[key] === "object");

  let allKeys = leafKeys;

  for (const nodeKey of nodeKeys) {
    const nodePath = path ? `${path}.${nodeKey}` : nodeKey;
    const node = privates[nodeKey] as UnknownObject;
    allKeys = allKeys.concat(allKeysForPrivates(node, nodePath));
  }

  return allKeys;
};

export const envPrivates = {
  allKeysForPrivates,
};
