import { useForm } from 'react-hook-form';
import type { IDatabaseAction } from '../../types/action.types';

interface DatabaseActionProps {
  action: IDatabaseAction;
  onChange: (action: IDatabaseAction) => void;
}

type DatabaseActionFormData = {
  tableId: string;
  operation: 'create' | 'update' | 'delete';
  data?: Record<string, any>;
  where?: any;
};

export function DatabaseAction({ action, onChange }: DatabaseActionProps) {
  const { register, watch, formState: { errors } } = useForm<DatabaseActionFormData>({
    defaultValues: {
      tableId: action.tableId || '',
      operation: action.operation || 'update',
      data: action.data || {},
      where: action.where,
    },
  });

  const tableId = watch('tableId');
  const operation = watch('operation');

  const handleChange = () => {
    onChange({
      type: 'database',
      tableId: tableId,
      operation: operation,
      data: watch('data'),
      where: watch('where'),
    });
  };

  return (
    <div className="space-y-4">
      {/* Table */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Table <span className="text-red-400">*</span>
        </label>
        <select
          {...register('tableId', {
            required: 'Table is required',
            onChange: handleChange,
          })}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select Table</option>
          {/* TODO: Fetch actual tables */}
        </select>
        {errors.tableId && (
          <p className="mt-1 text-xs text-red-400">{errors.tableId.message}</p>
        )}
      </div>

      {/* Operation */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Operation
        </label>
        <div className="flex gap-4">
          {(['create', 'update', 'delete'] as const).map((op) => (
            <label key={op} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={op}
                {...register('operation', { onChange: handleChange })}
                className="h-4 w-4 rounded border border-border bg-background text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground capitalize">{op}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Set Fields (for create/update) */}
      {(operation === 'create' || operation === 'update') && (
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Set Fields
          </label>
          <div className="rounded-lg border bg-background p-3">
            <p className="mb-2 text-xs text-muted-foreground">Key-value pairs</p>
            <div className="space-y-2">
              {/* TODO: Implement key-value pair editor */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Field name"
                  className="flex-1 rounded border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  placeholder="Value"
                  className="flex-1 rounded border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  className="px-2 py-1 text-sm text-destructive hover:text-destructive/80"
                >
                  ×
                </button>
              </div>
              <button
                type="button"
                className="text-xs text-primary hover:text-primary/80"
              >
                + Add Field
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Where (for update/delete) */}
      {(operation === 'update' || operation === 'delete') && (
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Where (Conditions)
          </label>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">
              Condition Builder - Coming soon
            </p>
            {/* TODO: Reuse ConditionBuilder component */}
          </div>
        </div>
      )}
    </div>
  );
}

