import { useEffect, useState } from "react";
import { api } from "../api";
import { Task, HealthInfo } from "../types";

interface Props {
  onViewTasks: () => void;
  onCreateTask: () => void;
}

export default function Dashboard({ onViewTasks, onCreateTask }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getTasks(), api.getHealth()])
      .then(([t, h]) => {
        setTasks(t);
        setHealth(h);
      })
      .catch((err) => console.error("Dashboard load error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const counts = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
    critical: tasks.filter((t) => t.priority === "critical").length,
  };

  const recentTasks = tasks.slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="mt-1 text-sm text-gray-500">
            Overview of tasks and system health
          </p>
        </div>
        <button
          onClick={onCreateTask}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + New Task
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total" value={counts.total} color="gray" />
        <StatCard label="To Do" value={counts.todo} color="blue" />
        <StatCard label="In Progress" value={counts.in_progress} color="amber" />
        <StatCard label="Done" value={counts.done} color="green" />
        <StatCard label="Critical" value={counts.critical} color="red" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Tasks</h3>
            <button
              onClick={onViewTasks}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              View all
            </button>
          </div>
          {recentTasks.length === 0 ? (
            <p className="text-sm text-gray-500">No tasks yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-800 truncate mr-3">
                    {task.title}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={task.status} />
                    <PriorityDot priority={task.priority} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">System Health</h3>
          {health ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd
                  className={`font-medium ${
                    health.status === "healthy"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {health.status}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Uptime</dt>
                <dd className="font-medium text-gray-900">
                  {formatUptime(health.uptime_seconds)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Database</dt>
                <dd
                  className={`font-medium ${
                    health.database.connected
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {health.database.connected ? "Connected" : "Disconnected"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Environment</dt>
                <dd className="font-medium text-gray-900">
                  {health.environment}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-gray-500">Unable to fetch health info</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    gray: "bg-gray-50 border-gray-200 text-gray-900",
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    green: "bg-green-50 border-green-200 text-green-900",
    red: "bg-red-50 border-red-200 text-red-900",
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color] || colorMap.gray}`}>
      <p className="text-sm font-medium opacity-70">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    todo: "bg-blue-100 text-blue-700",
    in_progress: "bg-amber-100 text-amber-700",
    done: "bg-green-100 text-green-700",
  };
  const labels: Record<string, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    done: "Done",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    low: "bg-gray-400",
    medium: "bg-blue-400",
    high: "bg-amber-500",
    critical: "bg-red-500",
  };
  return (
    <span
      className={`w-2 h-2 rounded-full ${colors[priority] || "bg-gray-400"}`}
      title={priority}
    />
  );
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}
