export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | "critical";
  created_at: string;
  updated_at: string;
}

export interface HealthInfo {
  status: string;
  uptime_seconds: number;
  database: {
    connected: boolean;
    server_time?: string;
    version?: string;
    error?: string;
  };
  environment: string;
}

export interface DebugResult {
  message: string;
  [key: string]: unknown;
}

export type TaskStatus = Task["status"];
export type TaskPriority = Task["priority"];
