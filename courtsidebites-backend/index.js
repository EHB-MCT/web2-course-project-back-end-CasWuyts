require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { openDatabase, database } = require("./database");
const { PORT } = require("./settings");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "CourtSide Bites backend online" });
});

app.get("/health/db", async (req, res) => {
  try {
    const db = database();
    const collections = await db.listCollections().toArray();
    res.json({
      connected: true,
      collections: collections.map(col => col.name)
    });
  } catch (err) {
    res.status(500).json({
      connected: false,
      error: err.message
    });
  }
});

openDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error("Startup failed:", err.message);
    process.exit(1);
  });
