import Conf from "conf";
import { UnknownObject } from "../types";

const config = new Conf({ configFileMode: 0o600 });

const saveEnvPrivateValues = async (env: string, privates: UnknownObject): Promise<void> => {
  config.set(envPrivateKey(env), privates);
};

const getEnvPrivateValues = async (env: string): Promise<any> => {
  return config.get(envPrivateKey(env)) || {};
};

const envPrivateKey = (env: string): string => `root.env-${env}.private`;

export const userstore = {
  saveEnvPrivateValues,
  getEnvPrivateValues,
};
