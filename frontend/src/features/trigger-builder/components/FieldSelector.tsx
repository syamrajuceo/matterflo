import type { IField, FieldType } from '../types/condition.types';

interface FieldSelectorProps {
  fields: IField[];
  value: string;
  onChange: (fieldId: string) => void;
  onFieldTypeChange?: (fieldType: FieldType) => void;
}

export function FieldSelector({ fields, value, onChange, onFieldTypeChange }: FieldSelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fieldId = e.target.value;
    onChange(fieldId);
    
    if (onFieldTypeChange) {
      const field = fields.find((f) => f.id === fieldId);
      if (field) {
        onFieldTypeChange(field.type);
      }
    }
  };

  return (
    <select
      value={value || ''}
      onChange={handleChange}
      className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <option value="">Select Field</option>
      {fields.map((field) => (
        <option key={field.id} value={field.id}>
          {field.label || field.name}
        </option>
      ))}
    </select>
  );
}

