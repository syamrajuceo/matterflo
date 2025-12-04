import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDatabaseStore } from '../store/databaseStore';
import { databaseService } from '../services/database.service';
import { useToast } from '@/components/ui/use-toast';
import type { ITableField } from '../types/database.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FieldFormData {
  name: string;
  displayName: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'relation' | 'computed';
  required: boolean;
  unique: boolean;
  defaultValue: string;
  min?: number;
  max?: number;
  pattern?: string;
  formula?: string;
}

export function FieldEditor() {
  const { currentTable, selectedField, setSelectedField, setCurrentTable, setHasUnsavedChanges } =
    useDatabaseStore();
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FieldFormData>({
    defaultValues: {
      name: '',
      displayName: '',
      type: 'text',
      required: false,
      unique: false,
      defaultValue: '',
    },
  });

  const fieldType = watch('type');

  useEffect(() => {
    if (selectedField) {
      reset({
        name: selectedField.name,
        displayName: selectedField.displayName,
        type: selectedField.type,
        required: selectedField.required,
        unique: selectedField.unique || false,
        defaultValue: selectedField.defaultValue !== undefined ? String(selectedField.defaultValue) : '',
        min: selectedField.validation?.min,
        max: selectedField.validation?.max,
        pattern: selectedField.validation?.pattern,
        formula: selectedField.formula || '',
      });
    } else {
      reset({
        name: '',
        displayName: '',
        type: 'text',
        required: false,
        unique: false,
        defaultValue: '',
      });
    }
  }, [selectedField, reset]);

  if (!currentTable) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground text-center">Select a table to edit fields</p>
      </div>
    );
  }

  if (!selectedField) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground text-center">Select a field to edit its properties</p>
      </div>
    );
  }

  const onSubmit = async (data: FieldFormData) => {
    if (!currentTable || !selectedField) return;

    try {
      const fieldUpdates: Partial<ITableField> = {
        name: data.name.trim().toLowerCase().replace(/\s+/g, '_'),
        displayName: data.displayName.trim(),
        type: data.type,
        required: data.required,
        unique: data.unique,
        defaultValue: data.defaultValue ? (data.type === 'number' ? Number(data.defaultValue) : data.defaultValue) : undefined,
        validation: {
          ...(data.min !== undefined && { min: data.min }),
          ...(data.max !== undefined && { max: data.max }),
          ...(data.pattern && { pattern: data.pattern }),
        },
        ...(data.type === 'computed' && data.formula && { formula: data.formula }),
      };

      // Update in store
      const updatedFields = currentTable.schema.fields.map((f) =>
        f.id === selectedField.id ? { ...f, ...fieldUpdates } : f
      );

      setCurrentTable({
        ...currentTable,
        schema: {
          ...currentTable.schema,
          fields: updatedFields,
        },
      });

      setSelectedField({ ...selectedField, ...fieldUpdates });
      setHasUnsavedChanges(true);

      showToast({
        title: 'Field updated',
        description: 'Changes will be saved when you click Save.',
        status: 'success',
      });
    } catch (error: any) {
      console.error('Failed to update field:', error);
      showToast({
        title: 'Failed to update field',
        description: error?.message || 'Please try again.',
        status: 'error',
      });
    }
  };

  return (
    <ScrollArea className="h-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
        <div className="space-y-2">
          <Label htmlFor="field-name">Field Name (snake_case)</Label>
          <Input
            id="field-name"
            {...register('name', {
              required: 'Field name is required',
              pattern: {
                value: /^[a-z][a-z0-9_]*$/,
                message: 'Must be lowercase letters, numbers, and underscores only',
              },
            })}
            placeholder="employee_name"
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="field-display-name">Display Name</Label>
          <Input
            id="field-display-name"
            {...register('displayName', { required: 'Display name is required' })}
            placeholder="Employee Name"
          />
          {errors.displayName && <p className="text-xs text-destructive">{errors.displayName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="field-type">Type</Label>
          <Select
            value={fieldType}
            onValueChange={(value) => setValue('type', value as FieldFormData['type'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="boolean">Boolean</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="relation">Relation</SelectItem>
              <SelectItem value="computed">Computed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="field-required"
            checked={watch('required')}
            onCheckedChange={(checked) => setValue('required', checked === true)}
          />
          <Label htmlFor="field-required" className="cursor-pointer">
            Required
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="field-unique"
            checked={watch('unique')}
            onCheckedChange={(checked) => setValue('unique', checked === true)}
          />
          <Label htmlFor="field-unique" className="cursor-pointer">
            Unique
          </Label>
        </div>

        {fieldType !== 'computed' && (
          <div className="space-y-2">
            <Label htmlFor="field-default-value">Default Value</Label>
            <Input
              id="field-default-value"
              {...register('defaultValue')}
              placeholder={fieldType === 'number' ? '0' : fieldType === 'boolean' ? 'true/false' : ''}
            />
          </div>
        )}

        {fieldType === 'number' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="field-min">Min Value</Label>
              <Input
                id="field-min"
                type="number"
                {...register('min', { valueAsNumber: true })}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="field-max">Max Value</Label>
              <Input
                id="field-max"
                type="number"
                {...register('max', { valueAsNumber: true })}
                placeholder="Optional"
              />
            </div>
          </>
        )}

        {fieldType === 'text' && (
          <div className="space-y-2">
            <Label htmlFor="field-pattern">Pattern (Regex)</Label>
            <Input
              id="field-pattern"
              {...register('pattern')}
              placeholder="^[A-Za-z]+$"
            />
            <p className="text-xs text-muted-foreground">Optional validation pattern</p>
          </div>
        )}

        {fieldType === 'computed' && (
          <div className="space-y-2">
            <Label htmlFor="field-formula">Formula</Label>
            <Textarea
              id="field-formula"
              {...register('formula')}
              placeholder="first_name + ' ' + last_name"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">JavaScript expression using other field names</p>
          </div>
        )}

        <Button type="submit" className="w-full">
          Update Field
        </Button>
      </form>
    </ScrollArea>
  );
}

