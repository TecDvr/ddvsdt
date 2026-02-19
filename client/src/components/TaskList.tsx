import { useEffect, useState, useCallback } from "react";
import { api } from "../api";
import { Task, TaskStatus, TaskPriority } from "../types";

interface Props {
  onEdit: (id: number) => void;
  onRefresh: () => void;
}

export default function TaskList({ onEdit, onRefresh }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    api
      .getTasks({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: search || undefined,
      })
      .then(setTasks)
      .catch((err) => console.error("Failed to load tasks:", err))
      .finally(() => setLoading(false));
  }, [search, statusFilter, priorityFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: number) {
    if (!confirm("Delete this task?")) return;
    try {
      await api.deleteTask(id);
      load();
      onRefresh();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  async function handleStatusChange(id: number, status: TaskStatus) {
    try {
      await api.updateTask(id, { status });
      load();
      onRefresh();
    } catch (err) {
      console.error("Status update failed:", err);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
        <span className="text-sm text-gray-500">{tasks.length} tasks</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No tasks found</p>
          <p className="text-sm mt-1">Try adjusting your filters or create a new task.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {task.title}
                    </h3>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Created {new Date(task.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={task.status}
                    onChange={(e) =>
                      handleStatusChange(task.id, e.target.value as TaskStatus)
                    }
                    className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                  <button
                    onClick={() => onEdit(task.id)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const styles: Record<TaskPriority, string> = {
    low: "bg-gray-100 text-gray-600",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-amber-100 text-amber-700",
    critical: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`px-1.5 py-0.5 rounded text-xs font-medium ${styles[priority]}`}
    >
      {priority}
    </span>
  );
}
