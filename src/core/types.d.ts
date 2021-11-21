import { Knex } from "knex";

export type UnknownObject = Record<string, unknown>;
export type State = UnknownObject;
export type OwlStore = {
  db: Knex;
};
