import { Plus, GripVertical, Trash2, Pencil, Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTaskBuilderStore } from '../store/taskBuilderStore';
import { taskService } from '../services/task.service';
import { useToast } from '@/components/ui/use-toast';
import type { ITaskField } from '../types/task.types';
import { Input } from '@/components/ui/input';
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

interface FieldCardProps {
  field: ITaskField;
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
      date: 'Date',
      dropdown: 'Dropdown',
      'multi-select': 'Multi-Select',
      checkbox: 'Checkbox',
      file: 'File',
      image: 'Image',
      'rich-text': 'Rich Text',
      'field-group': 'Field Group',
    };
    return labels[type] || type;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer rounded-md border bg-white p-3 transition shadow-sm ${
        isSelected
          ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-200'
          : 'border-slate-200 hover:border-blue-300 hover:shadow'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab p-0.5 text-slate-400 hover:text-slate-600 active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
              {getFieldTypeLabel(field.type)}
            </span>
            {field.required && (
              <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-500 rounded font-medium">Required</span>
            )}
          </div>
          <div className="text-xs font-medium text-slate-700 mt-1">
            {field.label || 'Unnamed Field'}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
          title="Delete field"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function FormCanvas() {
  const {
    currentTask,
    selectedField,
    setSelectedField,
    addField,
    deleteField,
    reorderFields,
    setHasUnsavedChanges,
    setCurrentTask,
  } = useTaskBuilderStore();

  const { showToast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddField = (type: string) => {
    if (!currentTask) return;

    const newField: ITaskField = {
      id: `temp-${Date.now()}`,
      type: type as any,
      label: `New ${type} Field`,
      required: false,
      order: currentTask.fields.length,
    };

    addField(newField);
    setSelectedField(newField);
    setHasUnsavedChanges(true);
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!currentTask) return;
    if (!confirm('Are you sure you want to delete this field?')) return;

    try {
      if (currentTask.id && !fieldId.startsWith('temp-')) {
        await taskService.deleteField(currentTask.id, fieldId);
      }
      deleteField(fieldId);
      if (selectedField?.id === fieldId) {
        setSelectedField(null);
      }
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Failed to delete field:', error);
      showToast({
        title: 'Failed to delete field',
        description: 'Please try again after reloading the task.',
        status: 'error',
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!currentTask) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = currentTask.fields.findIndex((f) => f.id === active.id);
    const newIndex = currentTask.fields.findIndex((f) => f.id === over.id);

    const reorderedFields = arrayMove(currentTask.fields, oldIndex, newIndex);
    const fieldIds = reorderedFields.map((f) => f.id);

    reorderFields(fieldIds);
    setHasUnsavedChanges(true);
  };

  // All hooks must be called before any early returns
  const [isEditingName, setIsEditingName] = useState(false);
  const [taskName, setTaskName] = useState(currentTask?.name || '');

  // Update local name when task changes
  useEffect(() => {
    if (currentTask) {
      setTaskName(currentTask.name);
    }
  }, [currentTask?.id, currentTask?.name]);

  if (!currentTask) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white">
        <div className="text-center">
          <p className="mb-2 text-sm text-slate-500">No task selected</p>
          <p className="text-xs text-slate-400">
            Select a task from the left or create a new one
          </p>
        </div>
      </div>
    );
  }

  const fieldIds = currentTask.fields.map((f) => f.id);

  const handleNameEdit = async () => {
    if (!currentTask || !currentTask.id) return;
    
    if (taskName.trim() === '') {
      setTaskName(currentTask.name);
      setIsEditingName(false);
      return;
    }

    if (taskName === currentTask.name) {
      setIsEditingName(false);
      return;
    }

    try {
      await taskService.updateTask(currentTask.id, { name: taskName.trim() });
      const updatedTask = await taskService.getTask(currentTask.id);
      setCurrentTask(updatedTask);
      setHasUnsavedChanges(false);
      setIsEditingName(false);
      
      // Dispatch event to refresh task list in sidebar
      window.dispatchEvent(new CustomEvent('task:updated', { detail: { taskId: currentTask.id } }));
      
      showToast({
        title: 'Task name updated',
        description: 'The task name has been saved.',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to update task name:', error);
      setTaskName(currentTask.name);
      setIsEditingName(false);
      showToast({
        title: 'Failed to update task name',
        description: 'Please try again.',
        status: 'error',
      });
    }
  };

  const handleCancelEdit = () => {
    setTaskName(currentTask.name);
    setIsEditingName(false);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 p-3">
        <div className="flex items-center justify-between">
          {isEditingName ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleNameEdit();
                  } else if (e.key === 'Escape') {
                    handleCancelEdit();
                  }
                }}
                className="h-7 text-xs font-bold uppercase tracking-wide border-slate-300 focus:border-blue-500"
                autoFocus
              />
              <button
                onClick={handleNameEdit}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
                title="Save"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                title="Cancel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wide">{currentTask.name}</h2>
              {currentTask.status !== 'PUBLISHED' && (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                  title="Edit task name"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
              {currentTask.status}
            </span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">
              v{currentTask.version}
            </span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">
              {currentTask.fields.length} fields
            </span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentTask.fields.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="mb-1 text-sm text-slate-500">No fields yet</p>
            <p className="mb-3 text-xs text-slate-400">
              Add fields from the palette on the left
            </p>
            <button
              onClick={() => handleAddField('text')}
              className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition font-medium"
            >
              <Plus className="w-3 h-3 inline mr-1" />
              Add First Field
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={fieldIds} strategy={verticalListSortingStrategy}>
              <div className="max-w-xl mx-auto space-y-2">
                {currentTask.fields.map((field) => (
                  <FieldCard
                    key={field.id}
                    field={field}
                    isSelected={selectedField?.id === field.id}
                    onSelect={() => setSelectedField(field)}
                    onDelete={() => handleDeleteField(field.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

