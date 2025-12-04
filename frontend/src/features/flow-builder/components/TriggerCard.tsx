import { useState } from 'react';
import { Zap, Settings, Trash2, ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react';
import type { ITrigger } from '../types/trigger.types';

interface TriggerCardProps {
  trigger: ITrigger;
  onEdit: () => void;
  onDelete: () => void;
}

export function TriggerCard({ trigger, onEdit, onDelete }: TriggerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCondition = (condition: any): string => {
    if (!condition) return '';
    if (typeof condition === 'string') return condition;
    if (condition.field && condition.operator && condition.value !== undefined) {
      const operatorMap: Record<string, string> = {
        equals: '=',
        not_equals: '≠',
        greater_than: '>',
        less_than: '<',
        contains: 'contains',
        not_contains: 'not contains',
      };
      return `${condition.field} ${operatorMap[condition.operator] || condition.operator} ${condition.value}`;
    }
    return JSON.stringify(condition);
  };

  const formatActions = (actions: any[]): string[] => {
    if (!Array.isArray(actions)) return [];
    return actions.map((action) => {
      if (typeof action === 'string') return action;
      if (action.type) {
        const actionMap: Record<string, string> = {
          email: 'Send email',
          flow: 'Start flow',
          webhook: 'Send webhook',
          database: 'Update database',
        };
        return `${actionMap[action.type] || action.type}${action.config?.to ? ` to ${action.config.to}` : ''}`;
      }
      return JSON.stringify(action);
    });
  };

  const conditions = trigger.conditions || [];
  const actions = Array.isArray(trigger.actions) ? trigger.actions : [];

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      {/* Collapsed View */}
      <div
        className="cursor-pointer p-3 transition hover:bg-card"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <Zap className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="truncate text-sm font-medium text-foreground">
                  {trigger.name}
                </h4>
                {trigger.isActive ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                )}
              </div>
              {!isExpanded && conditions.length > 0 && (
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  IF: {formatCondition(conditions[0])}
                  {conditions.length > 1 && ` +${conditions.length - 1} more`}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="rounded p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              title="Edit"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="rounded p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            {isExpanded ? (
              <ChevronUp className="ml-1 h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="ml-1 h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
        {!isExpanded && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span
              className={`rounded px-2 py-0.5 ${
                trigger.isActive
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {trigger.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        )}
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="space-y-3 border-t border-border px-3 pb-3">
          <div className="space-y-2 pt-3">
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">WHEN:</div>
              <div className="text-sm text-foreground">
                {trigger.eventType.replace(/_/g, ' ')}
              </div>
            </div>

            {conditions.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">IF:</div>
                <div className="space-y-1">
                  {conditions.map((condition, idx) => (
                    <div key={idx} className="text-sm text-foreground">
                      {formatCondition(condition)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {actions.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">THEN:</div>
                <div className="space-y-1">
                  {formatActions(actions).map((action, idx) => (
                    <div key={idx} className="flex items-center gap-1 text-sm text-foreground">
                      <span className="text-muted-foreground">•</span>
                      {action}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <span
                className={`rounded px-2 py-0.5 text-xs ${
                  trigger.isActive
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                Status: {trigger.isActive ? '✅ Active' : '⏸️ Inactive'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

