const { MongoClient } = require("mongodb");
const { DATABASE } = require("./settings");

let activeDb;

async function openDatabase() {
  if (activeDb) return activeDb;

  if (!DATABASE.uri) {
    throw new Error("No MongoDB connection string found");
  }

  const client = new MongoClient(DATABASE.uri);
  await client.connect();

  activeDb = client.db(DATABASE.name);
  console.log(`MongoDB ready (${activeDb.databaseName})`);

  return activeDb;
}

function database() {
  if (!activeDb) {
    throw new Error("Database not initialized");
  }
  return activeDb;
}

module.exports = { openDatabase, database };
