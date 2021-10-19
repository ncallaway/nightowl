import _ from "lodash";
import { ok, err, Result } from "neverthrow";
import { render } from "nunjucks";
import { RenderedEnvironment } from "..";
import { files } from "../lib/files";
import { paths } from "../lib/paths";
import { SavedEnvironment } from "./env";

export const get = async (env: string, privates: any = {}): Promise<Result<RenderedEnvironment, string>> => {
  const envPath = await paths.envPath(env);

  const resEnvRaw = await files.readJson(envPath);
  if (resEnvRaw.isErr()) {
    return err(resEnvRaw.error);
  }
  const envRaw = resEnvRaw.value as any;

  const savedEnv: SavedEnvironment = {
    values: envRaw.values || {},
    private: envRaw.private || [],
  };

  // todo: render the environment
  const renderedPrivates = {};
  for (const privateDesc of savedEnv.private) {
    if (privateDesc.key) {
      const val = _.get(privates, privateDesc.key) || "<unset-private-value>";
      // if (!val) {
      //   return e / rr(`No value was set for private environment value: ${privateDesc.key}`);
      // }
      _.set(renderedPrivates, privateDesc.key, val);
    }
  }

  const renderedEnv: RenderedEnvironment = _.assign({}, savedEnv.values, renderedPrivates);
  console.log("RENDERED: ", renderedEnv);

  return ok(renderedEnv);
};
