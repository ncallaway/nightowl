import { Knex } from "knex";

export async function up(db: Knex): Promise<void> {
  await db.schema.createTable("requests", (t) => {
    t.string("request_id").notNullable().primary();
    t.string("request_key").notNullable();
    t.string("body_compression");
    t.string("body_path");
    t.bigInteger("bytes_content");
    t.bigInteger("bytes_read");
    t.string("content_type");
    t.bigInteger("elapsed_time").notNullable();
    // t.string("environment");
    t.string("error");
    t.text("headers_json");
    t.string("http_version");
    t.string("message");
    // t.string("parent_id");
    t.boolean("setting_send_cookies");
    t.boolean("settings_store_cookies");
    t.integer("status_code");
    t.string("status_message");
    t.string("timeline_path");
    t.text("url");
  });

  await db.schema.createTable("states", (t) => {
    t.string("state_name").notNullable().primary();
    t.text("value_json").notNullable();
  });
}

export async function down(db: Knex): Promise<void> {
  await db.schema.dropTable("states");
  await db.schema.dropTable("requests");
}
