import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/projects.js";

export function createApp(users, projects, memberships) {
  const app = express();
  app.use(cors()); // React 5173 -> Express 9000
  app.use(express.json()); // req.body must be JSON
  app.use(authRoutes(users)); // POST /signup and POST /login
  if(projects && memberships) app.use(projectRoutes(users, projects, memberships)); // pa3 endpoints

  app.use((error, req, res, next) => {
    console.error("Request error:", error);
    res.status(error.status || 500).json({ message: error.status === 400 ? "Invalid JSON request." : "Server error." });
  });
  return app;
}
