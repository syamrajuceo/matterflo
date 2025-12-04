import { useState } from 'react';
import type { ConditionOperator, FieldType, IField } from '../types/condition.types';

interface ValueInputProps {
  fieldType: FieldType;
  operator: ConditionOperator;
  field?: IField;
  value: any;
  onChange: (value: any) => void;
}

export function ValueInput({ fieldType, operator, field, value, onChange }: ValueInputProps) {
  const [localValue, setLocalValue] = useState(value || '');

  // Operators that don't need a value
  const noValueOperators: ConditionOperator[] = ['is_null', 'is_not_null', 'is_true', 'is_false'];
  if (noValueOperators.includes(operator)) {
    return (
      <span className="text-xs text-gray-400 italic px-3 py-1.5">
        No value needed
      </span>
    );
  }

  // Between operator needs two values
  if (operator === 'between') {
    const [from, to] = Array.isArray(value) ? value : ['', ''];
    return (
      <div className="flex items-center gap-2">
        <input
          type={fieldType === 'date' ? 'date' : fieldType === 'number' ? 'number' : 'text'}
          value={from}
          onChange={(e) => {
            const newValue = [e.target.value, to];
            setLocalValue(newValue);
            onChange(newValue);
          }}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="From"
        />
        <span className="text-sm text-muted-foreground">and</span>
        <input
          type={fieldType === 'date' ? 'date' : fieldType === 'number' ? 'number' : 'text'}
          value={to}
          onChange={(e) => {
            const newValue = [from, e.target.value];
            setLocalValue(newValue);
            onChange(newValue);
          }}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="To"
        />
      </div>
    );
  }

  // In/not_in operators need multiple values
  if (operator === 'in' || operator === 'not_in') {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    return (
      <div className="space-y-2">
        {values.map((val: string, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={val}
              onChange={(e) => {
                const newValues = [...values];
                newValues[index] = e.target.value;
                setLocalValue(newValues);
                onChange(newValues);
              }}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Value"
            />
            <button
              type="button"
              onClick={() => {
                const newValues = values.filter((_: any, i: number) => i !== index);
                setLocalValue(newValues);
                onChange(newValues);
              }}
              className="px-2 py-1 text-sm text-destructive hover:text-destructive/80"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            const newValues = [...values, ''];
            setLocalValue(newValues);
            onChange(newValues);
          }}
          className="text-xs text-primary hover:text-primary/80"
        >
          + Add Value
        </button>
      </div>
    );
  }

  // Dropdown field with options
  if (fieldType === 'dropdown' && field?.options) {
    return (
      <select
        value={value || ''}
        onChange={(e) => {
          setLocalValue(e.target.value);
          onChange(e.target.value);
        }}
        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">Select Value</option>
        {field.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label || opt.value}
          </option>
        ))}
      </select>
    );
  }

  // Boolean field
  if (fieldType === 'boolean') {
    return (
      <select
        value={value ? 'true' : 'false'}
        onChange={(e) => {
          const boolValue = e.target.value === 'true';
          setLocalValue(boolValue);
          onChange(boolValue);
        }}
        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="true">True</option>
        <option value="false">False</option>
      </select>
    );
  }

  // Default input based on field type
  return (
    <input
      type={fieldType === 'date' ? 'date' : fieldType === 'number' ? 'number' : 'text'}
      value={localValue}
      onChange={(e) => {
        const newValue =
          fieldType === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
        setLocalValue(newValue);
        onChange(newValue);
      }}
      className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      placeholder="Enter value"
    />
  );
}

