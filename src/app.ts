import cors from "cors";
import express from "express";
import { TeamRoutes } from "./modules/team/team.routes";
import globalErrorHandler from "./middleware/globalErrorHandler";

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  cors({
    origin: "https://team-management-frontend-psi.vercel.app",
    credentials: true,
  })
);
// Routes
app.use("/api/v1/teams", TeamRoutes);

// Default route for testing
app.get("/", (_req, res) => {
  res.send("API is running");
});

app.use(globalErrorHandler);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found",
  });
});
export default app;
