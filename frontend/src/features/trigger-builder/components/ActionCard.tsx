import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EmailAction } from './actions/EmailAction';
import { FlowAction } from './actions/FlowAction';
import { DatabaseAction } from './actions/DatabaseAction';
import { WebhookAction } from './actions/WebhookAction';
import { TaskAction } from './actions/TaskAction';
import type { IAction } from '../types/action.types';
import { ACTION_TYPE_LABELS, ACTION_TYPE_ICONS } from '../types/action.types';

interface ActionCardProps {
  action: IAction;
  index: number;
  onUpdate: (action: IAction) => void;
  onDelete: () => void;
  isDragging?: boolean;
}

function getActionSummary(action: IAction): string {
  switch (action.type) {
    case 'email':
      const emailAction = action as any;
      const to = typeof emailAction.to === 'string' ? emailAction.to : emailAction.to?.[0] || 'Unknown';
      return `To: ${to} • Subject: ${emailAction.subject || 'No subject'}`;
    
    case 'flow':
      return `Flow: ${(action as any).flowId || 'Not selected'}`;
    
    case 'database':
      const dbAction = action as any;
      return `Table: ${dbAction.tableId || 'Not selected'} • ${dbAction.operation || 'update'}`;
    
    case 'webhook':
      const webhookAction = action as any;
      return `URL: ${webhookAction.url || 'Not set'} • Method: ${webhookAction.method || 'POST'}`;
    
    case 'task':
      const taskAction = action as any;
      return `Task: ${taskAction.taskId || 'Not selected'}`;
    
    default:
      return 'Action';
  }
}

export function ActionCard({ action, index, onUpdate, onDelete, isDragging }: ActionCardProps) {
  const [isExpanded, setIsExpanded] = useState(true); // Start expanded for new actions

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: action.type + '-' + index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const actionLabel = ACTION_TYPE_LABELS[action.type];
  const actionIcon = ACTION_TYPE_ICONS[action.type];
  const summary = getActionSummary(action);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="overflow-hidden rounded-lg border border-border bg-background"
    >
      {/* Header */}
      <div
        className="flex cursor-pointer items-center justify-between bg-card p-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Icon and Label */}
          <div className="flex items-center gap-2">
            <span className="text-lg">{actionIcon}</span>
            <span className="text-sm font-medium text-foreground">{actionLabel}</span>
          </div>

          {/* Summary */}
          {!isExpanded && (
            <span className="ml-4 flex-1 truncate text-xs text-muted-foreground">
              {summary}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="border-t p-4">
          {action.type === 'email' && (
            <EmailAction
              action={action as any}
              onChange={onUpdate}
            />
          )}
          {action.type === 'flow' && (
            <FlowAction
              action={action as any}
              onChange={onUpdate}
            />
          )}
          {action.type === 'database' && (
            <DatabaseAction
              action={action as any}
              onChange={onUpdate}
            />
          )}
          {action.type === 'webhook' && (
            <WebhookAction
              action={action as any}
              onChange={onUpdate}
            />
          )}
          {action.type === 'task' && (
            <TaskAction
              action={action as any}
              onChange={onUpdate}
            />
          )}
        </div>
      )}
    </div>
  );
}

