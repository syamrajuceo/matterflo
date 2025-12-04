import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../auth/store/authStore';

interface ClientLayoutProps {
  children: ReactNode;
}

export const ClientLayout = ({ children }: ClientLayoutProps) => {
  const user = useAuthStore((state) => state.user);

  const displayName = user?.name || 'John Doe';
  const companyName = user?.companyName || 'Acme Corp';

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <span className="text-lg">🏢</span>
            <span>{companyName}</span>
          </div>
          <button className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
            <span className="h-6 w-6 rounded-full bg-muted text-center text-sm leading-6">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <span>{displayName}</span>
            <span className="text-xs text-slate-400">▼</span>
          </button>
        </div>
      </header>

      {/* Nav */}
      <nav className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl gap-6 px-4 text-sm">
          <NavLink
            to="/client/dashboard"
            className={({ isActive }) =>
              `border-b-2 px-0 py-3 transition-colors ${
                isActive
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/client/tasks"
            className={({ isActive }) =>
              `border-b-2 px-0 py-3 transition-colors ${
                isActive
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`
            }
          >
            My Tasks
          </NavLink>
          <NavLink
            to="/client/flows"
            className={({ isActive }) =>
              `border-b-2 px-0 py-3 transition-colors ${
                isActive
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`
            }
          >
            Flows
          </NavLink>
          <NavLink
            to="/client/reports"
            className={({ isActive }) =>
              `border-b-2 px-0 py-3 transition-colors ${
                isActive
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`
            }
          >
            Reports
          </NavLink>
        </div>
      </nav>

      {/* Page content */}
      <main className="mx-auto max-w-6xl px-4 py-6 text-foreground">{children}</main>
    </div>
  );
};


