import { Link } from 'react-router-dom';
import type { IClientTask } from '../services/client.types';

interface PendingTasksProps {
  tasks: IClientTask[];
  isLoading: boolean;
  error: string | null;
}

export const PendingTasks = ({ tasks, isLoading, error }: PendingTasksProps) => {
  if (isLoading) {
    return <p className="text-xs text-muted-foreground">Loading pending tasks…</p>;
  }

  if (error) {
    return <p className="text-xs text-red-400">{error}</p>;
  }

  if (tasks.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No pending tasks. You&apos;re all caught up! 🎉
      </p>
    );
  }

  return (
    <>
      {tasks.map((task) => (
        <div
          key={task.id}
          className="rounded-xl border border-destructive/40 bg-gradient-to-r from-destructive/20 via-card to-card p-4"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-red-300">{task.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {task.amount} • Due: {task.due}
              </div>
            </div>
            <Link
              to={`/client/tasks/${task.id}/complete`}
              className="rounded-full bg-blue-500 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-blue-400"
            >
              Review Now →
            </Link>
          </div>
        </div>
      ))}
    </>
  );
};


