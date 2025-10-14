import cors from "cors";
import express from "express";

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));

// Rate Limiter

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
// Routes
// app.use("/api/v1");
// Default route for testing
app.get("/", (_req, res) => {
  res.send("API is running");
});

// app.use(globalErrorHandler);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found",
  });
});
export default app;
