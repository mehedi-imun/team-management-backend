import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import env from "./config/env";
import globalErrorHandler from "./middleware/globalErrorHandler";

// Import routes
import { AnalyticsRoutes } from "./modules/analytics/analytics.routes";
import { AuthRoutes } from "./modules/auth/auth.routes";
import { NotificationRoutes } from "./modules/notification/notification.routes";
import { TeamRoutes } from "./modules/team/team.routes";
import { UserRoutes } from "./modules/user/user.routes";

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// CORS
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// API Routes
app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/users", UserRoutes);
app.use("/api/v1/teams", TeamRoutes);
app.use("/api/v1/analytics", AnalyticsRoutes);
app.use("/api/v1/notifications", NotificationRoutes);

// Default route for testing
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Team Management API is running",
    version: "1.0.0",
    endpoints: {
      auth: "/api/v1/auth",
      users: "/api/v1/users",
      teams: "/api/v1/teams",
      analytics: "/api/v1/analytics",
      notifications: "/api/v1/notifications",
    },
  });
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
