import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";

export function createApp(users) {
  const app = express();
  app.use(cors()); // React 5173 -> Express 9000
  app.use(express.json()); // JSON request -> req.body
  app.use(authRoutes(users)); // POST /signup and POST /login

  app.use((error, req, res, next) => {
    console.error("Request error:", error);
    res.status(error.status || 500).json({ message: error.status === 400 ? "Invalid JSON request." : "Server error." });
  });
  return app;
}
