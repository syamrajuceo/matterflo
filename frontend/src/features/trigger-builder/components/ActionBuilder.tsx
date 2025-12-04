import { useState } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ActionCard } from './ActionCard';
import type { IAction, ActionType } from '../types/action.types';
import { ACTION_TYPE_LABELS } from '../types/action.types';

interface ActionBuilderProps {
  value: IAction[];
  onChange: (actions: IAction[]) => void;
}

const ACTION_TYPES: ActionType[] = ['email', 'flow', 'database', 'webhook', 'task'];

function createDefaultAction(type: ActionType): IAction {
  switch (type) {
    case 'email':
      return {
        type: 'email',
        sendToType: 'email',
        to: '',
        subject: '',
        body: '',
        includeTaskDetails: false,
        attachFiles: false,
      };
    case 'flow':
      return {
        type: 'flow',
        flowId: '',
        passData: 'all',
        priority: 'normal',
      };
    case 'database':
      return {
        type: 'database',
        tableId: '',
        operation: 'update',
      };
    case 'webhook':
      return {
        type: 'webhook',
        url: '',
        method: 'POST',
      };
    case 'task':
      return {
        type: 'task',
        taskId: '',
        priority: 'normal',
      };
  }
}

export function ActionBuilder({ value, onChange }: ActionBuilderProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const actions = value || [];

  const handleAddAction = (type: ActionType) => {
    const newAction = createDefaultAction(type);
    onChange([...actions, newAction]);
    setShowAddMenu(false);
  };

  const handleUpdateAction = (index: number, updated: IAction) => {
    const newActions = [...actions];
    newActions[index] = updated;
    onChange(newActions);
  };

  const handleDeleteAction = (index: number) => {
    if (!confirm('Are you sure you want to delete this action?')) {
      return;
    }
    const newActions = actions.filter((_, i) => i !== index);
    onChange(newActions);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = actions.findIndex((_, i) => `${actions[i].type}-${i}` === active.id);
    const newIndex = actions.findIndex((_, i) => `${actions[i].type}-${i}` === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      onChange(arrayMove(actions, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Action Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Action
          <ChevronDown className="w-4 h-4" />
        </button>

        {showAddMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowAddMenu(false)}
            />
            <div className="absolute left-0 top-full z-20 mt-2 w-48 rounded-lg border border-border bg-card shadow-lg">
              {ACTION_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleAddAction(type)}
                  className="w-full px-4 py-2 text-left text-sm text-foreground transition hover:bg-muted first:rounded-t-lg last:rounded-b-lg"
                >
                  {ACTION_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Action List */}
      {actions.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
          <p className="mb-4 text-sm text-muted-foreground">No actions added yet</p>
          <p className="text-xs text-muted-foreground">Click &quot;Add Action&quot; to get started</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={actions.map((_, i) => `${actions[i].type}-${i}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {actions.map((action, index) => (
                <ActionCard
                  key={`${action.type}-${index}`}
                  action={action}
                  index={index}
                  onUpdate={(updated) => handleUpdateAction(index, updated)}
                  onDelete={() => handleDeleteAction(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

