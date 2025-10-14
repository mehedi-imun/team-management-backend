import { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import env from "./config/env";



let server: Server | null = null;

async function startServer() {
  try {
    await mongoose.connect(env.DATABASE_URL);

    server = app.listen(env.PORT, () => {
      console.log(`app is listening on port ${env.PORT}`);
    });
  } catch (err) {
    console.log(err);
  }
}

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  if (server) {
    server.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on("unhandledRejection", (err) => {
  console.log(`😈 unahandledRejection is detected , shutting down ...`, err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

process.on("uncaughtException", () => {
  console.log(`😈 uncaughtException is detected , shutting down ...`);
  process.exit(1);
});


(async () => {
  await startServer();
})();