import express from "express";
import cors from "cors";
import morgan from "morgan";
import taskRoutes from "./routes/tasks";
import healthRoutes from "./routes/health";
import debugRoutes from "./routes/debug";
import { seed } from "./seed";

const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);

app.use(cors());
app.use(express.json());
app.use(morgan("combined"));

app.use("/api/tasks", taskRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/debug", debugRoutes);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(`Unhandled error: ${err.message}`, err.stack);
    res.status(500).json({
      error: err.message || "Internal server error",
      timestamp: new Date().toISOString(),
    });
  }
);

async function start() {
  console.log("Starting API server...");

  let retries = 10;
  while (retries > 0) {
    try {
      await seed();
      break;
    } catch (err) {
      retries--;
      if (retries === 0) {
        console.error("Failed to connect to database after 10 retries:", err);
        process.exit(1);
      }
      console.log(
        `Database not ready, retrying in 2s... (${retries} retries left)`
      );
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`API server listening on port ${PORT}`);
  });
}

start();
