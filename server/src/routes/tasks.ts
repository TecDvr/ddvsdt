import { Router, Request, Response } from "express";
import pool from "../db";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, priority, search } = req.query;
    const conditions: string[] = [];
    const params: string[] = [];

    if (status && typeof status === "string") {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (priority && typeof priority === "string") {
      params.push(priority);
      conditions.push(`priority = $${params.length}`);
    }
    if (search && typeof search === "string") {
      params.push(`%${search}%`);
      conditions.push(
        `(title ILIKE $${params.length} OR description ILIKE $${params.length})`
      );
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const query = `SELECT * FROM tasks ${where} ORDER BY created_at DESC`;
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
    if (rows.length === 0) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching task:", err);
    res.status(500).json({ error: "Failed to fetch task" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { title, description, status = "todo", priority = "medium" } = req.body;
    if (!title) {
      res.status(400).json({ error: "Title is required" });
      return;
    }
    const { rows } = await pool.query(
      "INSERT INTO tasks (title, description, status, priority) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, description || null, status, priority]
    );
    console.log(`Task created: ${rows[0].id} - ${title}`);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error creating task:", err);
    res.status(500).json({ error: "Failed to create task" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority } = req.body;
    const { rows } = await pool.query(
      `UPDATE tasks 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [title, description, status, priority, id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    console.log(`Task updated: ${id}`);
    res.json(rows[0]);
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      "DELETE FROM tasks WHERE id = $1 RETURNING *",
      [id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    console.log(`Task deleted: ${id}`);
    res.json({ message: "Task deleted", task: rows[0] });
  } catch (err) {
    console.error("Error deleting task:", err);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;
