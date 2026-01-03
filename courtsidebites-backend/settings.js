const PORT = process.env.PORT || 3000;

const DATABASE = {
  uri: process.env.MONGO_URI,
  name: process.env.DB_NAME || "courtsidebites"
};

module.exports = { PORT, DATABASE };
