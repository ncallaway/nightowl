import { Knex } from "knex";

export type UnknownObject = Record<string, unknown>;

export type OwlStore = {
  db: Knex;
};

export type State = {
  name: string;
  env: string;
  value: UnknownObject;
  cookies: UnknownObject;
};

export type StateSummary = {
  name: string;
  env: string;
  warnings?: string[];
  errors?: string[];
};
