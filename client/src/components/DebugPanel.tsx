import { useState } from "react";
import { api } from "../api";

interface TestResult {
  label: string;
  status: "pending" | "running" | "success" | "error";
  data?: unknown;
  error?: string;
  duration?: number;
}

export default function DebugPanel() {
  const [results, setResults] = useState<TestResult[]>([]);

  function updateResult(index: number, update: Partial<TestResult>) {
    setResults((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...update } : r))
    );
  }

  async function runTest(
    label: string,
    fn: () => Promise<unknown>
  ) {
    const index = results.length;
    setResults((prev) => [
      ...prev,
      { label, status: "running" },
    ]);
    const start = Date.now();
    try {
      const data = await fn();
      updateResult(index, {
        status: "success",
        data,
        duration: Date.now() - start,
      });
    } catch (err: unknown) {
      updateResult(index, {
        status: "error",
        error: err instanceof Error ? err.message : String(err),
        duration: Date.now() - start,
      });
    }
  }

  function clearResults() {
    setResults([]);
  }

  const tests = [
    {
      label: "Slow Response (3s)",
      description: "Triggers a 3-second delayed API response",
      fn: () => api.triggerSlow(3000),
      color: "amber",
    },
    {
      label: "Slow Response (8s)",
      description: "Triggers an 8-second delayed API response",
      fn: () => api.triggerSlow(8000),
      color: "amber",
    },
    {
      label: "Server Error (500)",
      description: "Triggers an intentional unhandled server error",
      fn: () => api.triggerError(),
      color: "red",
    },
    {
      label: "CPU Intensive",
      description: "Runs a Fibonacci(40) calculation on the server",
      fn: () => api.triggerCpu(40),
      color: "orange",
    },
    {
      label: "Heavy DB Queries",
      description: "Runs 20 concurrent PostgreSQL queries with pg_sleep",
      fn: () => api.triggerDbHeavy(),
      color: "purple",
    },
    {
      label: "Rapid API Burst (10x)",
      description: "Sends 10 task list requests in parallel",
      fn: () => Promise.all(Array.from({ length: 10 }, () => api.getTasks())),
      color: "blue",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Debug Panel</h2>
          <p className="mt-1 text-sm text-gray-500">
            Generate telemetry for observability testing. Each button triggers
            specific patterns visible in Dynatrace and Datadog.
          </p>
        </div>
        {results.length > 0 && (
          <button
            onClick={clearResults}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Clear Results
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tests.map((test) => (
          <button
            key={test.label}
            onClick={() => runTest(test.label, test.fn)}
            className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-gray-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <TestIcon color={test.color} />
              <h3 className="font-medium text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">
                {test.label}
              </h3>
            </div>
            <p className="text-xs text-gray-500">{test.description}</p>
          </button>
        ))}
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 text-sm">
              Test Results ({results.length})
            </h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {[...results].reverse().map((result, idx) => (
              <div key={idx} className="p-4 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <StatusDot status={result.status} />
                    <span className="font-medium text-gray-800">
                      {result.label}
                    </span>
                  </div>
                  {result.duration !== undefined && (
                    <span className="text-xs text-gray-400">
                      {result.duration}ms
                    </span>
                  )}
                </div>
                {result.error && (
                  <p className="text-red-600 text-xs mt-1 ml-5">
                    {result.error}
                  </p>
                )}
                {result.data != null && (
                  <pre className="text-xs text-gray-500 mt-1 ml-5 max-h-24 overflow-y-auto">
                    {JSON.stringify(result.data, null, 2).slice(0, 500)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TestIcon({ color }: { color: string }) {
  const colors: Record<string, string> = {
    amber: "bg-amber-100 text-amber-600",
    red: "bg-red-100 text-red-600",
    orange: "bg-orange-100 text-orange-600",
    purple: "bg-purple-100 text-purple-600",
    blue: "bg-blue-100 text-blue-600",
  };
  return (
    <span
      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
        colors[color] || colors.blue
      }`}
    >
      T
    </span>
  );
}

function StatusDot({ status }: { status: TestResult["status"] }) {
  const styles: Record<TestResult["status"], string> = {
    pending: "bg-gray-300",
    running: "bg-amber-400 animate-pulse",
    success: "bg-green-500",
    error: "bg-red-500",
  };
  return <span className={`w-2 h-2 rounded-full ${styles[status]}`} />;
}
