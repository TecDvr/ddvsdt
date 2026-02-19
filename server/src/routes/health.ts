import { Router, Request, Response } from "express";
import pool from "../db";

const router = Router();
const startTime = Date.now();

router.get("/", async (_req: Request, res: Response) => {
  const uptimeMs = Date.now() - startTime;
  const uptimeSeconds = Math.floor(uptimeMs / 1000);

  try {
    const result = await pool.query("SELECT NOW() as time, version() as version");
    res.json({
      status: "healthy",
      uptime_seconds: uptimeSeconds,
      database: {
        connected: true,
        server_time: result.rows[0].time,
        version: result.rows[0].version,
      },
      environment: process.env.NODE_ENV || "development",
    });
  } catch (err) {
    console.error("Health check failed:", err);
    res.status(503).json({
      status: "unhealthy",
      uptime_seconds: uptimeSeconds,
      database: { connected: false, error: String(err) },
      environment: process.env.NODE_ENV || "development",
    });
  }
});

export default router;
