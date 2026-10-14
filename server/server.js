import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { createApp } from "./src/app.js";

dotenv.config({ path: new URL("./.env", import.meta.url) }); // server/.env credentials
const port = process.env.PORT || 9000;

async function start() {
  if(!process.env.MONGO_URI) throw new Error("Missing MONGO_URI in server/.env");

  const client = new MongoClient(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  await client.connect(); // express backend then mongodb atlas or local database
  const db = client.db("pa2"); 
  const users = db.collection("users"); 
  const projects = db.collection("Projects");
  const memberships = db.collection("ProjectMemberships");
  await users.createIndex({ username: 1 }, { unique: true }); // enforce unique usernames

  await memberships.createIndex({ project_id: 1, user_id: 1 }, { unique: true }); // no duplicate memberships

  createApp(users, projects, memberships).listen(port, () => console.log(`Express running at http://localhost:${port}`));
  console.log("Connected to MongoDB database: pa2");
}

start().catch(error => {
  console.error("Startup failed:", error.message);
  process.exitCode = 1;
});
