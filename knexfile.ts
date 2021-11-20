const path = require("path");

module.exports = {
  client: "sqlite3",
  migrations: {
    tableName: "knex_migrations",
    directory: path.join(__dirname, "src", "core", "store", "migrations"),
  },
};
