import { GripVertical, X } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FieldSelector } from './FieldSelector';
import { OperatorSelector } from './OperatorSelector';
import { ValueInput } from './ValueInput';
import type { ICondition, IField, FieldType } from '../types/condition.types';

interface ConditionProps {
  condition: ICondition;
  fields: IField[];
  onUpdate: (condition: ICondition) => void;
  onDelete: () => void;
  isDragging?: boolean;
}

export function Condition({ condition, fields, onUpdate, onDelete, isDragging }: ConditionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: condition.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const selectedField = fields.find((f) => f.id === condition.field);
  const fieldType: FieldType = selectedField?.type || 'text';

  const handleFieldChange = (fieldId: string) => {
    onUpdate({
      ...condition,
      field: fieldId,
      // Reset operator and value when field changes
      operator: 'equals' as any,
      value: undefined,
    });
  };

  const handleOperatorChange = (operator: any) => {
    onUpdate({
      ...condition,
      operator,
      // Reset value for operators that don't need it
      value: ['is_null', 'is_not_null', 'is_true', 'is_false'].includes(operator) ? undefined : condition.value,
    });
  };

  const handleValueChange = (value: any) => {
    onUpdate({
      ...condition,
      value,
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border border-border bg-background p-3"
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Field Selector */}
      <FieldSelector
        fields={fields}
        value={condition.field || ''}
        onChange={handleFieldChange}
      />

      {/* Operator Selector */}
      {condition.field && (
        <OperatorSelector
          fieldType={fieldType}
          value={condition.operator}
          onChange={handleOperatorChange}
        />
      )}

      {/* Value Input */}
      {condition.field && condition.operator && (
        <div className="flex-1">
          <ValueInput
            fieldType={fieldType}
            operator={condition.operator}
            field={selectedField}
            value={condition.value}
            onChange={handleValueChange}
          />
        </div>
      )}

      {/* Delete Button */}
      <button
        type="button"
        onClick={onDelete}
        className="rounded p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

