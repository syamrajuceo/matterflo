import { useEffect, useMemo } from 'react';
import { ClientLayout } from './ClientLayout';
import { PendingTasks } from './PendingTasks';
import { useClientStore } from '../store/clientStore';
import { useAuthStore } from '../../auth/store/authStore';

export const ClientDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const { stats, pendingTasks, isLoading, error, loadDashboard, loadPendingTasks } =
    useClientStore();

  useEffect(() => {
    // Load dashboard stats and pending tasks when the dashboard mounts
    void loadDashboard();
    void loadPendingTasks();
  }, [loadDashboard, loadPendingTasks]);

  const computedStats = useMemo(
    () => ({
      pending: stats?.pendingCount ?? pendingTasks.length,
      urgent: stats?.urgentCount ?? pendingTasks.filter((t) => t.priority === 'urgent').length,
      done: stats?.completedCount ?? 47,
    }),
    [stats, pendingTasks]
  );

  const workflows = [
    { id: 'flow-1', name: 'Expense Approval', activeSteps: 2, totalSteps: 4 },
    { id: 'flow-2', name: 'Purchase Order', activeSteps: 1, totalSteps: 4 },
  ];

  const displayName = user?.name || 'John Doe';

  return (
    <ClientLayout>
      <h1 className="text-xl font-semibold">
        Welcome back, {displayName.split(' ')[0] || 'John'}! <span className="ml-1">👋</span>
      </h1>

      {/* Stats cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="text-2xl">📋</div>
          <div className="mt-2 text-2xl font-semibold text-slate-50">
            {computedStats.pending}
          </div>
          <div className="text-sm text-slate-400">Pending</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-2xl">⏰</div>
          <div className="mt-2 text-2xl font-semibold text-red-400">
            {computedStats.urgent}
          </div>
          <div className="text-sm text-slate-400">Urgent</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-2xl">✅</div>
          <div className="mt-2 text-2xl font-semibold text-emerald-400">
            {computedStats.done}
          </div>
          <div className="text-sm text-slate-400">Done</div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Pending tasks */}
        <section className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">📌 My Pending Tasks</h2>
          <PendingTasks tasks={pendingTasks} isLoading={isLoading} error={error} />
        </section>

        {/* Active workflows (static demo for now) */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            🔄 Active Workflows ({workflows.length})
          </h2>
          <div className="space-y-3">
            {workflows.map((flow) => (
              <div
                key={flow.id}
                className="rounded-xl border bg-card p-3 text-xs text-muted-foreground"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{flow.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {flow.activeSteps}/{flow.totalSteps} steps
                  </span>
                </div>
                <div className="mt-2 flex gap-1">
                  {Array.from({ length: flow.totalSteps }).map((_, idx) => {
                    const active = idx < flow.activeSteps;
                    return (
                      <span
                        key={idx}
                        className={`h-1.5 flex-1 rounded-full ${
                          active ? 'bg-blue-500' : 'bg-slate-700'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </ClientLayout>
  );
};

