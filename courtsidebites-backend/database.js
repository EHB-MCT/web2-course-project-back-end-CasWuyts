const { MongoClient } = require("mongodb");
const { DATABASE } = require("./settings");

let db;

async function openDatabase() {
  if (db) return db;
  if (!DATABASE.uri) throw new Error("Mongo URI missing");

  const client = new MongoClient(DATABASE.uri);
  await client.connect();

  db = client.db(DATABASE.name);
  console.log(`MongoDB connected (${db.databaseName})`);

  return db;
}

function getDatabase() {
  if (!db) throw new Error("Database not initialized");
  return db;
}

module.exports = { openDatabase, getDatabase };
