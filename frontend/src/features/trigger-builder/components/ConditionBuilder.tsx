import { useMemo } from 'react';
import { Plus } from 'lucide-react';
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
import { ConditionGroup } from './ConditionGroup';
import { Condition } from './Condition';
import type { ICondition, IConditionGroup, IField } from '../types/condition.types';
import { OPERATOR_LABELS } from '../types/condition.types';
import { v4 as uuidv4 } from 'uuid';

interface ConditionBuilderProps {
  value: IConditionGroup | ICondition | null | undefined;
  onChange: (conditions: IConditionGroup | ICondition | null) => void;
  availableFields: IField[];
}

/**
 * Convert flat condition array to condition group structure
 */
function normalizeToGroup(conditions: ICondition[] | IConditionGroup | ICondition | null | undefined): IConditionGroup | null {
  if (!conditions) {
    return null;
  }

  // If it's already a group, return it
  if ('operator' in conditions && 'conditions' in conditions) {
    return conditions as IConditionGroup;
  }

  // If it's a single condition, wrap it in a group
  if ('field' in conditions && 'operator' in conditions) {
    return {
      id: uuidv4(),
      operator: 'AND',
      conditions: [conditions as ICondition],
    };
  }

  // If it's an array, wrap in a group
  if (Array.isArray(conditions)) {
    return {
      id: uuidv4(),
      operator: 'AND',
      conditions: conditions.map((c) => {
        if ('id' in c && typeof c === 'object' && c !== null) {
          return c as ICondition | IConditionGroup;
        }
        if (typeof c === 'object' && c !== null) {
          return {
            id: uuidv4(),
            ...(c as Record<string, any>),
          } as ICondition;
        }
        return {
          id: uuidv4(),
          field: '',
          operator: 'equals' as any,
          value: undefined,
        } as ICondition;
      }),
    };
  }

  return null;
}

/**
 * Generate human-readable condition preview
 */
function generatePreview(
  group: IConditionGroup | null,
  availableFields: IField[],
  depth = 0
): string {
  if (!group || !group.conditions || group.conditions.length === 0) {
    return 'No conditions';
  }

  const parts = group.conditions.map((condition) => {
    if ('operator' in condition && 'conditions' in condition) {
      // It's a nested group
      return `(${generatePreview(condition as IConditionGroup, availableFields, depth + 1)})`;
    } else {
      // It's a condition
      const cond = condition as ICondition;
      const field = availableFields.find((f) => f.id === cond.field);
      const fieldName = field?.label || field?.name || cond.field || 'Field';
      const operator = cond.operator || 'equals';
      
      // Get operator label
      const operatorLabel = OPERATOR_LABELS[operator as keyof typeof OPERATOR_LABELS] || operator;
      
      let valueStr = '';

      if (['is_null', 'is_not_null', 'is_true', 'is_false'].includes(operator)) {
        valueStr = '';
      } else if (operator === 'between' && Array.isArray(cond.value)) {
        valueStr = ` ${cond.value[0]} and ${cond.value[1]}`;
      } else if ((operator === 'in' || operator === 'not_in') && Array.isArray(cond.value)) {
        valueStr = ` (${cond.value.join(', ')})`;
      } else if (cond.value !== undefined && cond.value !== null && cond.value !== '') {
        valueStr = ` ${cond.value}`;
      } else {
        valueStr = '';
      }

      return `${fieldName} ${operatorLabel}${valueStr}`;
    }
  });

  return parts.join(` ${group.operator} `);
}

export function ConditionBuilder({ value, onChange, availableFields }: ConditionBuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Normalize value to condition group
  const conditionGroup = useMemo(() => {
    return normalizeToGroup(value);
  }, [value]);

  const handleAddGroup = () => {
    const newGroup: IConditionGroup = {
      id: uuidv4(),
      operator: 'AND',
      conditions: [],
    };

    if (conditionGroup) {
      // Add to existing group
      onChange({
        ...conditionGroup,
        conditions: [...conditionGroup.conditions, newGroup],
      });
    } else {
      // Create new group
      onChange(newGroup);
    }
  };

  const handleAddCondition = () => {
    const newCondition: ICondition = {
      id: uuidv4(),
      field: '',
      operator: 'equals' as any,
      value: undefined,
    };

    if (conditionGroup) {
      onChange({
        ...conditionGroup,
        conditions: [...conditionGroup.conditions, newCondition],
      });
    } else {
      // Create new group with condition
      onChange({
        id: uuidv4(),
        operator: 'AND',
        conditions: [newCondition],
      });
    }
  };


  const handleDragEnd = (event: DragEndEvent) => {
    if (!conditionGroup) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Find the condition/group being dragged
    const findAndReorder = (group: IConditionGroup): IConditionGroup => {
      const activeIndex = group.conditions.findIndex((c) => c.id === active.id);
      const overIndex = group.conditions.findIndex((c) => c.id === over.id);

      if (activeIndex !== -1 && overIndex !== -1) {
        // Reorder within this group
        return {
          ...group,
          conditions: arrayMove(group.conditions, activeIndex, overIndex),
        };
      }

      // Recursively check nested groups
      return {
        ...group,
        conditions: group.conditions.map((c) => {
          if ('operator' in c && 'conditions' in c) {
            return findAndReorder(c as IConditionGroup);
          }
          return c;
        }),
      };
    };

    const updated = findAndReorder(conditionGroup);
    onChange(updated);
  };

  const preview = useMemo(() => {
    return generatePreview(conditionGroup, availableFields);
  }, [conditionGroup, availableFields]);

  if (!conditionGroup) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
          <p className="mb-4 text-sm text-muted-foreground">No conditions added yet</p>
          <button
            type="button"
            onClick={handleAddCondition}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Your First Condition
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Preview Box */}
      <div className="rounded-lg border bg-background p-3">
        <div className="mb-1 text-xs text-muted-foreground">Preview:</div>
        <div className="text-sm font-mono text-foreground">
          {preview}
        </div>
      </div>

      {/* Condition Groups */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={conditionGroup.conditions.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {conditionGroup.conditions.map((condition) => {
              if ('operator' in condition && 'conditions' in condition) {
                return (
                  <ConditionGroup
                    key={condition.id}
                    group={condition as IConditionGroup}
                    fields={availableFields}
                    onUpdate={(updated) => {
                      const newConditions = conditionGroup.conditions.map((c) =>
                        c.id === condition.id ? updated : c
                      );
                      onChange({
                        ...conditionGroup,
                        conditions: newConditions,
                      });
                    }}
                    onDelete={() => {
                      const newConditions = conditionGroup.conditions.filter(
                        (c) => c.id !== condition.id
                      );
                      onChange({
                        ...conditionGroup,
                        conditions: newConditions,
                      });
                    }}
                  />
                );
              } else {
                const cond = condition as ICondition;
                return (
                  <Condition
                    key={cond.id}
                    condition={cond}
                    fields={availableFields}
                    onUpdate={(updated: ICondition) => {
                      const newConditions = conditionGroup.conditions.map((c) =>
                        c.id === cond.id ? updated : c
                      );
                      onChange({
                        ...conditionGroup,
                        conditions: newConditions,
                      });
                    }}
                    onDelete={() => {
                      const newConditions = conditionGroup.conditions.filter(
                        (c) => c.id !== cond.id
                      );
                      onChange({
                        ...conditionGroup,
                        conditions: newConditions,
                      });
                    }}
                  />
                );
              }
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAddCondition}
          className="flex items-center gap-1.5 rounded border border-border bg-card px-3 py-2 text-sm text-foreground transition hover:bg-muted"
        >
          <Plus className="w-4 h-4" />
          Add {conditionGroup.operator} Condition
        </button>
        <button
          type="button"
          onClick={handleAddGroup}
          className="flex items-center gap-1.5 rounded border border-border bg-card px-3 py-2 text-sm text-foreground transition hover:bg-muted"
        >
          <Plus className="w-4 h-4" />
          Add OR Group
        </button>
      </div>
    </div>
  );
}

