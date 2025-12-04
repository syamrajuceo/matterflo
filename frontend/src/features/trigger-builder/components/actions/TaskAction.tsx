import { useForm } from 'react-hook-form';
import type { ITaskAction } from '../../types/action.types';

interface TaskActionProps {
  action: ITaskAction;
  onChange: (action: ITaskAction) => void;
}

type TaskActionFormData = {
  taskId: string;
  assignTo?: string;
  dueDateType: 'none' | 'absolute' | 'relative';
  dueDate?: string;
  relativeValue?: number;
  relativeUnit?: 'days' | 'weeks' | 'months';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
};

export function TaskAction({ action, onChange }: TaskActionProps) {
  const dueDate = action.dueDate;
  const isRelative = typeof dueDate === 'object' && dueDate?.type === 'relative';

  const { register, watch, formState: { errors } } = useForm<TaskActionFormData>({
    defaultValues: {
      taskId: action.taskId || '',
      assignTo: action.assignTo,
      dueDateType: isRelative ? 'relative' : dueDate ? 'absolute' : 'none',
      dueDate: typeof dueDate === 'string' ? dueDate : undefined,
      relativeValue: isRelative ? dueDate.value : undefined,
      relativeUnit: isRelative ? dueDate.unit : 'days',
      priority: action.priority || 'normal',
    },
  });

  const taskId = watch('taskId');
  const assignTo = watch('assignTo');
  const dueDateType = watch('dueDateType');
  const formDueDate = watch('dueDate');
  const relativeValue = watch('relativeValue');
  const relativeUnit = watch('relativeUnit');
  const priority = watch('priority');

  const handleChange = () => {
    let finalDueDate: string | { type: 'relative'; value: number; unit: 'days' | 'weeks' | 'months' } | undefined;
    
    if (dueDateType === 'absolute' && formDueDate) {
      finalDueDate = formDueDate;
    } else if (dueDateType === 'relative' && relativeValue) {
      finalDueDate = {
        type: 'relative',
        value: relativeValue,
        unit: relativeUnit || 'days',
      };
    }

    onChange({
      type: 'task',
      taskId: taskId,
      assignTo: assignTo,
      dueDate: finalDueDate,
      priority: priority,
    });
  };

  return (
    <div className="space-y-4">
      {/* Task */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Task <span className="text-destructive">*</span>
        </label>
        <select
          {...register('taskId', {
            required: 'Task is required',
            onChange: handleChange,
          })}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select Task</option>
          {/* TODO: Fetch actual tasks */}
        </select>
        {errors.taskId && (
          <p className="mt-1 text-xs text-red-400">{errors.taskId.message}</p>
        )}
      </div>

      {/* Assign To */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Assign To
        </label>
        <select
          {...register('assignTo', { onChange: handleChange })}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Auto Assign</option>
          {/* TODO: Fetch actual users/roles */}
        </select>
      </div>

      {/* Due Date */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Due Date
        </label>
        <select
          {...register('dueDateType', { onChange: handleChange })}
          className="mb-2 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="none">No Due Date</option>
          <option value="absolute">Specific Date</option>
          <option value="relative">Relative Date</option>
        </select>

        {dueDateType === 'absolute' && (
          <input
            type="date"
            {...register('dueDate', { onChange: handleChange })}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        )}

        {dueDateType === 'relative' && (
          <div className="flex gap-2">
            <input
              type="number"
              {...register('relativeValue', {
                valueAsNumber: true,
                onChange: handleChange,
              })}
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Number"
            />
            <select
              {...register('relativeUnit', { onChange: handleChange })}
              className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </select>
          </div>
        )}
      </div>

      {/* Priority */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Priority
        </label>
        <select
          {...register('priority', { onChange: handleChange })}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>
    </div>
  );
}

