import { Knex } from "knex";

export async function up(db: Knex): Promise<void> {
  await db.schema.dropTable("states");

  await db.schema.createTable("states", (t) => {
    t.string("name").notNullable();
    t.string("env").notNullable();
    t.text("value_json").notNullable();
    t.text("cookies_json").notNullable();

    t.primary(["name", "env"]);
  });
}

export async function down(db: Knex): Promise<void> {
  await db.schema.dropTable("states");
}
