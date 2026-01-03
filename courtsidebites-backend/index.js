require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

const { openDatabase, getDatabase } = require("./database");
const { PORT, AUTH } = require("./settings");

const app = express();
app.use(cors());
app.use(express.json());

/* auth helpers  */

function createToken(payload) {
  return jwt.sign(payload, AUTH.secret, { expiresIn: AUTH.expiresIn });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    req.user = jwt.verify(header.split(" ")[1], AUTH.secret);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}



app.get("/", (req, res) => {
  res.json({ status: "CourtSide Bites backend online" });
});

/*  courts  */

app.get("/courts", async (req, res) => {
  try {
    const db = getDatabase();
    const { search } = req.query;

    const query = {};
    if (search) {
      const s = String(search).trim();
      query.$or = [
        { name: { $regex: s, $options: "i" } },
        { city: { $regex: s, $options: "i" } },
        { address: { $regex: s, $options: "i" } }
      ];
    }

    const courts = await db.collection("courts").find(query).toArray();
    res.json(courts);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/courts/:id", async (req, res) => {
  try {
    const db = getDatabase();
    const court = await db.collection("courts").findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!court) return res.status(404).json({ message: "Court not found" });
    res.json(court);
  } catch {
    res.status(400).json({ message: "Invalid court id" });
  }
});

app.get("/courts/:id/snacks", async (req, res) => {
  try {
    const db = getDatabase();
    const courtId = new ObjectId(req.params.id);

    const snacks = await db
      .collection("snackbars")
      .find({ linkedCourtId: courtId.toString() })
      .sort({ distanceFromCourtMeters: 1 })
      .toArray();

    res.json(snacks);
  } catch {
    res.status(400).json({ message: "Invalid court id" });
  }
});

/*  auth  */

app.post("/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const db = getDatabase();

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    const exists = await db.collection("users").findOne({ email: cleanEmail });
    if (exists) return res.status(409).json({ message: "Email already exists" });

    const passwordHash = await bcrypt.hash(String(password), 10);

    const result = await db.collection("users").insertOne({
      username: String(username).trim(),
      email: cleanEmail,
      passwordHash,
      createdAt: new Date()
    });

    const user = { id: result.insertedId.toString(), username: String(username).trim(), email: cleanEmail };
    res.status(201).json({ user, token: createToken(user) });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = getDatabase();

    const cleanEmail = String(email).toLowerCase().trim();

    const userDoc = await db.collection("users").findOne({ email: cleanEmail });
    if (!userDoc) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(String(password), userDoc.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const user = { id: userDoc._id.toString(), username: userDoc.username, email: userDoc.email };
    res.json({ user, token: createToken(user) });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/*  games */

app.get("/games", requireAuth, async (req, res) => {
  try {
    const db = getDatabase();
    const games = await db.collection("games").find().toArray();
    res.json(games);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/games", requireAuth, async (req, res) => {
  try {
    const db = getDatabase();

    const game = {
      ...req.body,
      creatorUserId: req.user.id,
      players: [req.user.id],
      createdAt: new Date()
    };

    const result = await db.collection("games").insertOne(game);
    res.status(201).json({ id: result.insertedId.toString(), ...game });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/games/:id/join", requireAuth, async (req, res) => {
  try {
    const db = getDatabase();

    const game = await db.collection("games").findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!game) return res.status(404).json({ message: "Game not found" });
    if (game.players?.includes(req.user.id)) return res.json({ message: "Already joined" });

    await db.collection("games").updateOne(
      { _id: game._id },
      { $push: { players: req.user.id } }
    );

    res.json({ message: "Joined game" });
  } catch {
    res.status(400).json({ message: "Invalid game id" });
  }
});

app.post("/games/:id/leave", requireAuth, async (req, res) => {
  try {
    const db = getDatabase();

    const game = await db.collection("games").findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!game) return res.status(404).json({ message: "Game not found" });

    await db.collection("games").updateOne(
      { _id: game._id },
      { $pull: { players: req.user.id } }
    );

    res.json({ message: "Left game" });
  } catch {
    res.status(400).json({ message: "Invalid game id" });
  }
});

/*  start server */

openDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
