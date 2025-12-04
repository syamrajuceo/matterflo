import { useState } from 'react';
import { Plus, GripVertical, Trash2, Edit2, Key, AlertCircle, Calculator } from 'lucide-react';
import { useDatabaseStore } from '../store/databaseStore';
import { databaseService } from '../services/database.service';
import { useToast } from '@/components/ui/use-toast';
import type { ITableField } from '../types/database.types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DataTable } from './DataTable';
import { RecordManager } from './RecordManager';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';

interface FieldCardProps {
  field: ITableField;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function FieldCard({ field, isSelected, onSelect, onDelete }: FieldCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getFieldTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      text: 'Text',
      number: 'Number',
      boolean: 'Boolean',
      date: 'Date',
      relation: 'Relation',
      computed: 'Computed',
    };
    return labels[type] || type;
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`mb-3 cursor-pointer transition ${
        isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/60'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
              {getFieldTypeLabel(field.type)}
            </span>
            {field.required && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-destructive/20 text-destructive rounded">
                <AlertCircle className="w-3 h-3" />
                Required
              </span>
            )}
            {field.unique && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">
                <Key className="w-3 h-3" />
                Unique
              </span>
            )}
            {field.type === 'computed' && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded">
                <Calculator className="w-3 h-3" />
                Computed
              </span>
            )}
          </div>
          <div className="font-medium text-foreground">{field.displayName || field.name}</div>
          <div className="mt-1 text-sm text-muted-foreground font-mono">{field.name}</div>
          {field.defaultValue !== undefined && (
            <div className="mt-1 text-xs text-muted-foreground">
              Default: {String(field.defaultValue)}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="h-8 w-8"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function TableDesigner() {
  const {
    currentTable,
    setCurrentTable,
    selectedField,
    setSelectedField,
    setHasUnsavedChanges,
    activeTab,
    setActiveTab,
  } = useDatabaseStore();
  const { showToast } = useToast();
  const [isAddFieldDialogOpen, setIsAddFieldDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!currentTable) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Select a table to start designing</p>
        </div>
      </div>
    );
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !currentTable) return;

    const oldIndex = currentTable.schema.fields.findIndex((f) => f.id === active.id);
    const newIndex = currentTable.schema.fields.findIndex((f) => f.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newFields = arrayMove(currentTable.schema.fields, oldIndex, newIndex);
    setCurrentTable({
      ...currentTable,
      schema: {
        ...currentTable.schema,
        fields: newFields,
      },
    });
    setHasUnsavedChanges(true);
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!currentTable) return;

    if (!confirm(`Are you sure you want to delete this field? This action cannot be undone.`)) {
      return;
    }

    try {
      // Optimistic update
      const updatedFields = currentTable.schema.fields.filter((f) => f.id !== fieldId);
      setCurrentTable({
        ...currentTable,
        schema: {
          ...currentTable.schema,
          fields: updatedFields,
        },
      });
      setHasUnsavedChanges(true);

      // If field has a real ID (not temp), delete from backend
      if (!fieldId.startsWith('temp-')) {
        await databaseService.deleteField(currentTable.id, fieldId);
      }

      if (selectedField?.id === fieldId) {
        setSelectedField(null);
      }

      showToast({
        title: 'Field deleted',
        description: 'The field has been removed.',
        status: 'success',
      });
    } catch (error: any) {
      console.error('Failed to delete field:', error);
      // Rollback on error
      setCurrentTable(currentTable);
      const errorMessage =
        error?.response?.data?.error?.message || error?.message || 'Failed to delete field';
      showToast({
        title: 'Failed to delete field',
        description: errorMessage,
        status: 'error',
      });
    }
  };

  const handleAddField = () => {
    setIsAddFieldDialogOpen(true);
  };

  const handleConfirmAddField = async (data: {
    name: string;
    displayName: string;
    type: 'text' | 'number' | 'boolean' | 'date' | 'relation' | 'computed';
    required: boolean;
    unique: boolean;
  }) => {
    if (!currentTable) return;

    const newField: ITableField = {
      id: `temp-${Date.now()}`,
      name: data.name.trim().toLowerCase().replace(/\s+/g, '_'),
      displayName: data.displayName.trim(),
      type: data.type,
      required: data.required,
      unique: data.unique,
    };

    // Add to store
    const updatedFields = [...currentTable.schema.fields, newField];
    setCurrentTable({
      ...currentTable,
      schema: {
        ...currentTable.schema,
        fields: updatedFields,
      },
    });

    setSelectedField(newField);
    setHasUnsavedChanges(true);
    setIsAddFieldDialogOpen(false);

    showToast({
      title: 'Field added',
      description: 'The field has been added. Click Save to persist changes.',
      status: 'success',
    });
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'schema' | 'data')} className="flex h-full flex-col">
        <div className="border-b bg-card px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{currentTable.displayName}</h2>
              {currentTable.description && (
                <p className="mt-1 text-sm text-muted-foreground">{currentTable.description}</p>
              )}
            </div>
            <TabsList>
              <TabsTrigger value="schema">Schema</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="schema" className="flex-1 overflow-y-auto p-6 mt-0">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Fields</h3>
              <p className="text-xs text-muted-foreground">
                {currentTable.schema.fields.length} field{currentTable.schema.fields.length === 1 ? '' : 's'}
              </p>
            </div>
            <Button size="sm" onClick={handleAddField}>
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>

          {currentTable.schema.fields.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">No fields yet. Add your first field to get started.</p>
              <Button onClick={handleAddField}>
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={currentTable.schema.fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                {currentTable.schema.fields.map((field) => (
                  <FieldCard
                    key={field.id}
                    field={field}
                    isSelected={selectedField?.id === field.id}
                    onSelect={() => setSelectedField(field)}
                    onDelete={() => handleDeleteField(field.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </TabsContent>

        <TabsContent value="data" className="flex-1 overflow-hidden mt-0">
          <RecordManager />
        </TabsContent>
      </Tabs>

      {/* Add Field Dialog */}
      <AddFieldDialog
        open={isAddFieldDialogOpen}
        onOpenChange={setIsAddFieldDialogOpen}
        onConfirm={handleConfirmAddField}
      />
    </div>
  );
}

interface AddFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: {
    name: string;
    displayName: string;
    type: 'text' | 'number' | 'boolean' | 'date' | 'relation' | 'computed';
    required: boolean;
    unique: boolean;
  }) => void;
}

function AddFieldDialog({ open, onOpenChange, onConfirm }: AddFieldDialogProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<{
    name: string;
    displayName: string;
    type: 'text' | 'number' | 'boolean' | 'date' | 'relation' | 'computed';
    required: boolean;
    unique: boolean;
  }>({
    defaultValues: {
      name: '',
      displayName: '',
      type: 'text',
      required: false,
      unique: false,
    },
  });

  const fieldType = watch('type');

  const onSubmit = (data: any) => {
    onConfirm(data);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Field</DialogTitle>
          <DialogDescription>Add a new field to your table schema.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-field-name">Field Name (snake_case)</Label>
            <Input
              id="new-field-name"
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
            <Label htmlFor="new-field-display-name">Display Name</Label>
            <Input
              id="new-field-display-name"
              {...register('displayName', { required: 'Display name is required' })}
              placeholder="Employee Name"
            />
            {errors.displayName && <p className="text-xs text-destructive">{errors.displayName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-field-type">Type</Label>
            <Select value={fieldType} onValueChange={(value) => setValue('type', value as any)}>
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
              id="new-field-required"
              checked={watch('required')}
              onCheckedChange={(checked) => setValue('required', checked === true)}
            />
            <Label htmlFor="new-field-required" className="cursor-pointer">
              Required
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="new-field-unique"
              checked={watch('unique')}
              onCheckedChange={(checked) => setValue('unique', checked === true)}
            />
            <Label htmlFor="new-field-unique" className="cursor-pointer">
              Unique
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Field</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

