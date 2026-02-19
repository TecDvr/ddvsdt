import { Task, HealthInfo, DebugResult } from "./types";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getTasks(params?: {
    status?: string;
    priority?: string;
    search?: string;
  }): Promise<Task[]> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.priority) qs.set("priority", params.priority);
    if (params?.search) qs.set("search", params.search);
    const query = qs.toString();
    return request(`/tasks${query ? `?${query}` : ""}`);
  },

  getTask(id: number): Promise<Task> {
    return request(`/tasks/${id}`);
  },

  createTask(
    data: Pick<Task, "title"> & Partial<Pick<Task, "description" | "status" | "priority">>
  ): Promise<Task> {
    return request("/tasks", { method: "POST", body: JSON.stringify(data) });
  },

  updateTask(
    id: number,
    data: Partial<Pick<Task, "title" | "description" | "status" | "priority">>
  ): Promise<Task> {
    return request(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },

  deleteTask(id: number): Promise<{ message: string; task: Task }> {
    return request(`/tasks/${id}`, { method: "DELETE" });
  },

  getHealth(): Promise<HealthInfo> {
    return request("/health");
  },

  triggerSlow(delay = 3000): Promise<DebugResult> {
    return request(`/debug/slow?delay=${delay}`);
  },

  triggerError(): Promise<DebugResult> {
    return request("/debug/error");
  },

  triggerCpu(n = 40): Promise<DebugResult> {
    return request(`/debug/cpu?n=${n}`);
  },

  triggerDbHeavy(): Promise<DebugResult> {
    return request("/debug/db-heavy");
  },
};
