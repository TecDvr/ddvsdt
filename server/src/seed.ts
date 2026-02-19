import pool from "./db";

const SAMPLE_TASKS = [
  { title: "Set up CI/CD pipeline", description: "Configure GitHub Actions for automated builds and deployments to staging environment", status: "done", priority: "high" },
  { title: "Design landing page", description: "Create wireframes and mockups for the new product landing page", status: "done", priority: "high" },
  { title: "Implement user authentication", description: "Add JWT-based authentication with login, signup, and password reset flows", status: "in_progress", priority: "critical" },
  { title: "Write API documentation", description: "Document all REST endpoints using OpenAPI 3.0 specification", status: "in_progress", priority: "medium" },
  { title: "Optimize database queries", description: "Profile slow queries and add appropriate indexes to the tasks and users tables", status: "in_progress", priority: "high" },
  { title: "Add unit tests for task service", description: "Achieve 80% code coverage for the task CRUD service layer", status: "todo", priority: "medium" },
  { title: "Set up monitoring alerts", description: "Configure alerting rules for error rate spikes, latency thresholds, and CPU usage", status: "todo", priority: "high" },
  { title: "Implement search functionality", description: "Add full-text search across task titles and descriptions with pg_trgm", status: "todo", priority: "medium" },
  { title: "Create admin dashboard", description: "Build an admin panel for managing users, viewing system metrics, and audit logs", status: "todo", priority: "low" },
  { title: "Migrate to TypeScript strict mode", description: "Enable strict null checks and fix all resulting type errors across the codebase", status: "in_progress", priority: "medium" },
  { title: "Add rate limiting", description: "Implement API rate limiting using a sliding window counter in Redis", status: "todo", priority: "high" },
  { title: "Fix mobile navigation bug", description: "Hamburger menu does not close after selecting a navigation item on iOS Safari", status: "todo", priority: "critical" },
  { title: "Implement dark mode", description: "Add system-preference-aware dark mode with a manual toggle override", status: "done", priority: "low" },
  { title: "Refactor error handling", description: "Centralize error handling middleware and standardize error response format", status: "in_progress", priority: "medium" },
  { title: "Set up database backups", description: "Configure automated daily PostgreSQL backups with 30-day retention to S3", status: "todo", priority: "critical" },
  { title: "Add pagination to task list", description: "Implement cursor-based pagination for the task listing endpoint", status: "done", priority: "medium" },
  { title: "Review security headers", description: "Audit and configure Content-Security-Policy, HSTS, and X-Frame-Options headers", status: "todo", priority: "high" },
  { title: "Performance load testing", description: "Run k6 load tests simulating 500 concurrent users and document bottlenecks", status: "todo", priority: "medium" },
  { title: "Update Node.js to v22", description: "Upgrade runtime from Node 18 to Node 22 LTS and verify all dependencies are compatible", status: "todo", priority: "low" },
  { title: "Integrate Slack notifications", description: "Send deployment status and critical alert notifications to the #engineering Slack channel", status: "done", priority: "low" },
];

export async function seed(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
        priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    const { rows } = await client.query("SELECT COUNT(*) as count FROM tasks");
    if (parseInt(rows[0].count, 10) === 0) {
      console.log("Seeding database with sample tasks...");
      for (const task of SAMPLE_TASKS) {
        await client.query(
          "INSERT INTO tasks (title, description, status, priority) VALUES ($1, $2, $3, $4)",
          [task.title, task.description, task.status, task.priority]
        );
      }
      console.log(`Seeded ${SAMPLE_TASKS.length} tasks`);
    } else {
      console.log("Database already seeded, skipping");
    }
  } finally {
    client.release();
  }
}
