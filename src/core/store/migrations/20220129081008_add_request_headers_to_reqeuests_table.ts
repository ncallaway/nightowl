import { Knex } from "knex";

export async function up(db: Knex): Promise<void> {
  await db.schema.table("requests", (t) => {
    t.text("request_headers_json");
    t.dateTime("sent_at", { useTz: true });
  });
}

export async function down(db: Knex): Promise<void> {
  await db.schema.table("requests", (t) => {
    t.dropColumn("request_headers_json");
    t.dropColumn("sent_at");
  });
}
