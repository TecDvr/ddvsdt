import { useState } from "react";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import TaskList from "./components/TaskList";
import TaskForm from "./components/TaskForm";
import DebugPanel from "./components/DebugPanel";

type Page = "dashboard" | "tasks" | "create" | "debug";

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleEditTask(id: number) {
    setEditingTaskId(id);
    setPage("create");
  }

  function handleTaskSaved() {
    setEditingTaskId(null);
    setRefreshKey((k) => k + 1);
    setPage("tasks");
  }

  function handleNavigate(p: Page) {
    if (p === "create") setEditingTaskId(null);
    setPage(p);
  }

  return (
    <Layout currentPage={page} onNavigate={handleNavigate}>
      {page === "dashboard" && (
        <Dashboard
          key={refreshKey}
          onViewTasks={() => setPage("tasks")}
          onCreateTask={() => handleNavigate("create")}
        />
      )}
      {page === "tasks" && (
        <TaskList
          key={refreshKey}
          onEdit={handleEditTask}
          onRefresh={() => setRefreshKey((k) => k + 1)}
        />
      )}
      {page === "create" && (
        <TaskForm
          editId={editingTaskId}
          onSaved={handleTaskSaved}
          onCancel={() => setPage("tasks")}
        />
      )}
      {page === "debug" && <DebugPanel />}
    </Layout>
  );
}
