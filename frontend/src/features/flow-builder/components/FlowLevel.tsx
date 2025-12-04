import { Settings, Trash2, Plus } from 'lucide-react';
import type { IFlowLevel } from '../types/flow.types';
import { TriggerSection } from './TriggerSection';
import { useFlowBuilderStore } from '../store/flowBuilderStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface FlowLevelProps {
  level: IFlowLevel;
  isSelected: boolean;
  displayOrder: number;
  readOnly: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onAddTask: () => void;
  onAddRole: () => void;
  onSettings: () => void;
  onAddTrigger?: () => void;
}

export function FlowLevel({
  level,
  displayOrder,
  isSelected,
  readOnly,
  onSelect,
  onDelete,
  onAddTask,
  onAddRole,
  onSettings,
  onAddTrigger,
}: FlowLevelProps) {
  const { currentFlow } = useFlowBuilderStore();
  return (
    <Card
      className={`relative cursor-pointer border-2 transition-all ${
        isSelected
          ? 'border-primary shadow-lg shadow-primary/20'
          : 'border-border hover:border-primary'
      }`}
      onClick={onSelect}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {displayOrder}
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">{level.name}</h3>
            {level.description && (
              <p className="text-sm text-muted-foreground">{level.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={readOnly}
            className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            onClick={(e) => {
              e.stopPropagation();
              onSettings();
            }}
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={readOnly}
            className="h-8 w-8 text-muted-foreground hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete level"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Inline summary */}
        <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[11px] text-muted-foreground">
          <span>{level.tasks.length} task{level.tasks.length === 1 ? '' : 's'}</span>
          <span className="mx-1">•</span>
          <span>{level.roles.length} role{level.roles.length === 1 ? '' : 's'}</span>
          {currentFlow?.branches && (
            <>
              <span className="mx-1">•</span>
              <span>
                {currentFlow.branches.filter((b) => b.fromLevelId === level.id).length} branch
                {currentFlow.branches.filter((b) => b.fromLevelId === level.id).length === 1
                  ? ''
                  : 'es'}
              </span>
            </>
          )}
        </div>

        {/* Assigned Roles */}
        {level.roles.length > 0 && (
          <div>
            <div className="mb-1 text-xs font-medium text-foreground">Roles</div>
            <div className="flex flex-wrap gap-1.5">
              {level.roles.map((roleId) => (
                <span
                  key={roleId}
                  className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-foreground"
                >
                  {roleId}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tasks List */}
        <div>
          <div className="mb-1 text-xs font-medium text-foreground">Tasks</div>
          {level.tasks.length === 0 ? (
            <div className="text-sm italic text-muted-foreground">No tasks assigned</div>
          ) : (
            <div className="space-y-1.5">
              {level.tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                >
                  {task.task?.name || `Task ${task.order}`}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={readOnly}
            className="h-7 gap-1 px-2.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            onClick={(e) => {
              e.stopPropagation();
              onAddTask();
            }}
          >
            <Plus className="h-3 w-3" />
            Task
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={readOnly}
            className="h-7 gap-1 px-2.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            onClick={(e) => {
              e.stopPropagation();
              onAddRole();
            }}
          >
            <Plus className="h-3 w-3" />
            Role
          </Button>
        </div>

        {/* Auto Actions / Triggers Section */}
        {currentFlow && (
          <TriggerSection
            flowId={currentFlow.id}
            levelId={level.id}
            onAddTrigger={onAddTrigger}
          />
        )}
      </CardContent>
    </Card>
  );
}

