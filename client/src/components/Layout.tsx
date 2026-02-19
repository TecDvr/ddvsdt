import { ReactNode } from "react";

type Page = "dashboard" | "tasks" | "create" | "debug";

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
}

const NAV_ITEMS: { page: Page; label: string }[] = [
  { page: "dashboard", label: "Dashboard" },
  { page: "tasks", label: "Tasks" },
  { page: "create", label: "New Task" },
  { page: "debug", label: "Debug Panel" },
];

export default function Layout({ currentPage, onNavigate, children }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                TF
              </div>
              <h1 className="text-xl font-semibold text-gray-900">TaskFlow</h1>
              <span className="hidden sm:inline text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                Observability Test
              </span>
            </div>
            <nav className="flex gap-1">
              {NAV_ITEMS.map(({ page, label }) => (
                <button
                  key={page}
                  onClick={() => onNavigate(page)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
