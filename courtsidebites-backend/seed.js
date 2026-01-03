require("dotenv").config();
const { openDatabase, getDatabase } = require("./database");

async function seed() {
  await openDatabase();
  const db = getDatabase();

  await db.collection("courts").deleteMany({});
  await db.collection("snackbars").deleteMany({});

  const courts = [
    {
      name: "Place Poelaert Court",
      address: "Place Poelaert",
      city: "Brussels",
      postalCode: "1000",
      latitude: 50.8386,
      longitude: 4.3517,
      averageRating: 0,
      ratingCount: 0,
      hasUpcomingGames: false,
      createdAt: new Date()
    },
    {
      name: "Flagey Court",
      address: "Place Flagey",
      city: "Ixelles",
      postalCode: "1050",
      latitude: 50.827,
      longitude: 4.3722,
      averageRating: 0,
      ratingCount: 0,
      hasUpcomingGames: false,
      createdAt: new Date()
    }
  ];

  const result = await db.collection("courts").insertMany(courts);
  const ids = Object.values(result.insertedIds).map((id) => id.toString());

  await db.collection("snackbars").insertMany([
    {
      name: "Frituur Example",
      address: "Nearby street 12",
      city: "Brussels",
      postalCode: "1000",
      linkedCourtId: ids[0],
      distanceFromCourtMeters: 250,
      averageRating: 0,
      ratingCount: 0,
      createdAt: new Date()
    },
    {
      name: "Snack Corner",
      address: "Another street 5",
      city: "Ixelles",
      postalCode: "1050",
      linkedCourtId: ids[1],
      distanceFromCourtMeters: 180,
      averageRating: 0,
      ratingCount: 0,
      createdAt: new Date()
    }
  ]);

  console.log("Seed completed");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
