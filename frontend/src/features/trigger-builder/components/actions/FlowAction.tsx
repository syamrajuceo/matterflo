import { useForm } from 'react-hook-form';
import type { IFlowAction } from '../../types/action.types';

interface FlowActionProps {
  action: IFlowAction;
  onChange: (action: IFlowAction) => void;
}

type FlowActionFormData = {
  flowId: string;
  assignTo?: string;
  passData: 'all' | 'specific';
  specificFields?: string[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
};

export function FlowAction({ action, onChange }: FlowActionProps) {
  const { register, watch, formState: { errors } } = useForm<FlowActionFormData>({
    defaultValues: {
      flowId: action.flowId || '',
      assignTo: action.assignTo,
      passData: action.passData || 'all',
      specificFields: action.specificFields || [],
      priority: action.priority || 'normal',
    },
  });

  const flowId = watch('flowId');
  const assignTo = watch('assignTo');
  const passData = watch('passData');
  const priority = watch('priority');

  const handleChange = () => {
    onChange({
      type: 'flow',
      flowId: flowId,
      assignTo: assignTo,
      passData: passData,
      priority: priority,
    });
  };

  return (
    <div className="space-y-4">
      {/* Flow */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Flow <span className="text-destructive">*</span>
        </label>
        <select
          {...register('flowId', {
            required: 'Flow is required',
            onChange: handleChange,
          })}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select Flow</option>
          {/* TODO: Fetch actual flows */}
        </select>
        {errors.flowId && (
          <p className="mt-1 text-xs text-destructive">{errors.flowId.message}</p>
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

      {/* Pass Data */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Pass Data
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="all"
                {...register('passData', { onChange: handleChange })}
                className="h-4 w-4 rounded border border-border bg-background text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">All</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="specific"
                {...register('passData', { onChange: handleChange })}
                className="h-4 w-4 rounded border border-border bg-background text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">Specific Fields</span>
          </label>
        </div>
        {passData === 'specific' && (
          <div className="mt-2">
            <input
              type="text"
              placeholder="Comma-separated field names"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {/* TODO: Implement field selection */}
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

