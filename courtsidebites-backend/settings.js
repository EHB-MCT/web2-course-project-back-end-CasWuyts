const PORT = process.env.PORT || 3000;

const DATABASE = {
  uri: process.env.MONGO_URI,
  name: process.env.DB_NAME || "courtsidebites"
};

const AUTH = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || "7d"
};

module.exports = { PORT, DATABASE, AUTH };
