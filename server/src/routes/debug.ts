import { Router, Request, Response } from "express";
import pool from "../db";

const router = Router();

router.get("/slow", async (req: Request, res: Response) => {
  const delay = Math.min(parseInt(req.query.delay as string, 10) || 3000, 30000);
  console.log(`Debug: slow endpoint triggered with ${delay}ms delay`);
  await new Promise((resolve) => setTimeout(resolve, delay));
  res.json({
    message: "Slow response completed",
    delay_ms: delay,
    timestamp: new Date().toISOString(),
  });
});

router.get("/error", (_req: Request, _res: Response) => {
  console.error("Debug: intentional error endpoint triggered");
  throw new Error(
    "Intentional server error for observability testing - this error is expected"
  );
});

router.get("/cpu", (req: Request, res: Response) => {
  const n = Math.min(parseInt(req.query.n as string, 10) || 40, 45);
  console.log(`Debug: CPU-intensive endpoint triggered with fib(${n})`);

  const start = Date.now();
  function fib(num: number): number {
    if (num <= 1) return num;
    return fib(num - 1) + fib(num - 2);
  }
  const result = fib(n);
  const duration = Date.now() - start;

  res.json({
    message: "CPU-intensive operation completed",
    fibonacci_n: n,
    result,
    duration_ms: duration,
    timestamp: new Date().toISOString(),
  });
});

router.get("/db-heavy", async (_req: Request, res: Response) => {
  console.log("Debug: heavy database query endpoint triggered");
  const start = Date.now();

  try {
    const queries = Array.from({ length: 20 }, (_, i) =>
      pool.query(
        "SELECT *, pg_sleep(0.05) FROM tasks ORDER BY random() LIMIT 10"
      )
    );
    const results = await Promise.all(queries);
    const duration = Date.now() - start;

    res.json({
      message: "Heavy DB operation completed",
      queries_executed: results.length,
      total_rows: results.reduce((sum, r) => sum + r.rows.length, 0),
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Debug db-heavy error:", err);
    res.status(500).json({ error: "Heavy DB query failed" });
  }
});

export default router;
