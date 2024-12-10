"use strict";
/** Database setup for jobly. */
const { Client } = require("pg");
const { getDatabaseUri } = require("./config");

let db;

if (process.env.NODE_ENV === "production") {
  db = new Client({
    connectionString: getDatabaseUri(),
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  db = new Client({
    connectionString: getDatabaseUri()
  });
}

db.connect()
  .then(() => {
    console.log(`Connected sucessfully to ${getDatabaseUri()}`);
  })
  .catch((err) => {
    console.error("Database connection error:", err.stack);
    process.exit(1);
  });

module.exports = db;