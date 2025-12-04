import type { DatasetSection } from '../../services/dataset.service';

interface TasksSectionProps {
  section: DatasetSection;
  mode: 'edit' | 'preview';
  data?: unknown;
}

export const TasksSection: React.FC<TasksSectionProps> = ({ section, mode, data }) => {
  const source = (section.config?.source as string) || 'tasks';
  const status = (section.config?.status as string) || 'ANY';
  const limitRaw = section.config?.limit;
  const limit = typeof limitRaw === 'number' ? limitRaw : Number(limitRaw) || 10;

  if (mode === 'edit') {
    return (
      <div className="space-y-1 text-xs">
        <div className="font-semibold text-foreground">{section.title}</div>
        <div className="text-muted-foreground">
          Showing tasks from <span className="font-medium">{source}</span> with status{' '}
          <span className="font-medium">{status}</span> (max {limit})
        </div>
      </div>
    );
  }

  const tasks = Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];

  if (tasks.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        No tasks to display for this section.
      </div>
    );
  }

  return (
    <div className="space-y-2 text-xs">
      <div className="font-semibold text-foreground">{section.title}</div>
      <ul className="space-y-1">
        {tasks.map((task, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <li key={index} className="flex items-center justify-between rounded-md bg-muted px-2 py-1">
            <span className="truncate font-medium">
              {(task.name as string) || (task.title as string) || 'Untitled task'}
            </span>
            <span className="ml-2 shrink-0 text-[10px] uppercase text-muted-foreground">
              {(task.status as string) || 'N/A'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};


