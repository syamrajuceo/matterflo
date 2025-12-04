import type { ConditionOperator, FieldType } from '../types/condition.types';
import { OPERATORS_BY_TYPE, OPERATOR_LABELS } from '../types/condition.types';

interface OperatorSelectorProps {
  fieldType: FieldType;
  value: ConditionOperator;
  onChange: (operator: ConditionOperator) => void;
}

export function OperatorSelector({ fieldType, value, onChange }: OperatorSelectorProps) {
  const availableOperators = OPERATORS_BY_TYPE[fieldType] || OPERATORS_BY_TYPE.text;

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value as ConditionOperator)}
      className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {availableOperators.map((op) => (
        <option key={op} value={op}>
          {OPERATOR_LABELS[op] || op}
        </option>
      ))}
    </select>
  );
}

