import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { createApp } from "./src/app.js";

dotenv.config({ path: new URL("./.env", import.meta.url) }); // server/.env credentials
const port = process.env.PORT || 9000;

async function start() {
  if(!process.env.MONGO_URI) throw new Error("Missing MONGO_URI in server/.env");

  const client = new MongoClient(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  await client.connect(); // Express backend -> MongoDB Atlas or local database
  const db = client.db("pa2"); // database shown in instructions
  const users = db.collection("users"); // MongoDB collection
  await users.createIndex({ username: 1 }, { unique: true }); // enforce unique usernames

  createApp(users).listen(port, () => console.log(`Express running at http://localhost:${port}`));
  console.log("Connected to MongoDB database: pa2");
}

start().catch(error => {
  console.error("Startup failed:", error.message);
  process.exitCode = 1;
});
