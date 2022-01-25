import { envLib } from "./env";

export const env = {
  listSummary: envLib.listSummary,
  summaryFor: envLib.summaryFor,
  getPrompts: envLib.getPrompts,
  get: envLib.get,
  getPrivateKeys: envLib.getPrivateKeys,
  create: envLib.create,
  update: envLib.update,
  delete: envLib.delete,
  rename: envLib.rename,
  setDefault: envLib.setDefault,
  getDefault: envLib.getDefault,
  getActive: envLib.getActive,
  isValidEnvironmentName: envLib.isValidEnvironmentName,
  exists: envLib.exists,
};
