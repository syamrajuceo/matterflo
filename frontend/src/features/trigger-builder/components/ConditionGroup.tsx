import { useState } from 'react';
import { GripVertical, X, Plus } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Condition } from './Condition';
import type { ICondition, IConditionGroup, IField } from '../types/condition.types';
import { v4 as uuidv4 } from 'uuid';

interface ConditionGroupProps {
  group: IConditionGroup;
  fields: IField[];
  onUpdate: (group: IConditionGroup) => void;
  onDelete: () => void;
  isDragging?: boolean;
  depth?: number;
}

export function ConditionGroup({
  group,
  fields,
  onUpdate,
  onDelete,
  isDragging,
  depth = 0,
}: ConditionGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleAddCondition = () => {
    const newCondition: ICondition = {
      id: uuidv4(),
      field: '',
      operator: 'equals' as any,
      value: undefined,
    };
    onUpdate({
      ...group,
      conditions: [...group.conditions, newCondition],
    });
  };

  const handleAddGroup = () => {
    const newGroup: IConditionGroup = {
      id: uuidv4(),
      operator: 'AND',
      conditions: [],
    };
    onUpdate({
      ...group,
      conditions: [...group.conditions, newGroup],
    });
  };

  const handleUpdateCondition = (index: number, updated: ICondition | IConditionGroup) => {
    const newConditions = [...group.conditions];
    newConditions[index] = updated;
    onUpdate({
      ...group,
      conditions: newConditions,
    });
  };

  const handleDeleteCondition = (index: number) => {
    const newConditions = group.conditions.filter((_, i) => i !== index);
    onUpdate({
      ...group,
      conditions: newConditions,
    });
  };

  const handleOperatorChange = (newOperator: 'AND' | 'OR') => {
    onUpdate({
      ...group,
      operator: newOperator,
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-border bg-background p-4"
    >
      {/* Group Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <span className="text-xs font-medium text-muted-foreground">
            {group.operator} Group {depth > 0 ? `(Level ${depth + 1})` : ''}
          </span>

          <select
            value={group.operator}
            onChange={(e) => handleOperatorChange(e.target.value as 'AND' | 'OR')}
            className="rounded border border-border bg-card px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Group Content */}
      {isExpanded && (
        <div className="space-y-3 border-l-2 border-border pl-4">
          {group.conditions.map((condition, index) => {
            // Check if it's a condition or a group
            if ('operator' in condition && 'conditions' in condition) {
              // It's a group
              return (
                <ConditionGroup
                  key={condition.id}
                  group={condition as IConditionGroup}
                  fields={fields}
                  onUpdate={(updated) => handleUpdateCondition(index, updated)}
                  onDelete={() => handleDeleteCondition(index)}
                  depth={depth + 1}
                />
              );
            } else {
              // It's a condition
              return (
                <Condition
                  key={condition.id}
                  condition={condition as ICondition}
                  fields={fields}
                  onUpdate={(updated) => handleUpdateCondition(index, updated)}
                  onDelete={() => handleDeleteCondition(index)}
                />
              );
            }
          })}

          {/* Add Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleAddCondition}
              className="flex items-center gap-1.5 rounded border border-border bg-card px-3 py-1.5 text-xs text-foreground transition hover:bg-muted"
            >
              <Plus className="w-3 h-3" />
              Add {group.operator} Condition
            </button>
            <button
              type="button"
              onClick={handleAddGroup}
              className="flex items-center gap-1.5 rounded border border-border bg-card px-3 py-1.5 text-xs text-foreground transition hover:bg-muted"
            >
              <Plus className="w-3 h-3" />
              Add OR Group
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

