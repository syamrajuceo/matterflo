import { X, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTaskBuilderStore } from '../store/taskBuilderStore';
import { taskService } from '../services/task.service';
import { useToast } from '@/components/ui/use-toast';
import type { ITaskField, FieldType } from '../types/task.types';

export function FieldPropertiesPanel() {
  const {
    selectedField,
    currentTask,
    setCurrentTask,
    setSelectedField,
    updateField,
    setHasUnsavedChanges,
    isPropertiesPanelCollapsed,
    setIsPropertiesPanelCollapsed,
  } = useTaskBuilderStore();

  const { showToast } = useToast();

  const [label, setLabel] = useState(selectedField?.label || '');
  const [placeholder, setPlaceholder] = useState(selectedField?.placeholder || '');
  const [required, setRequired] = useState(selectedField?.required || false);
  const [fieldType, setFieldType] = useState<FieldType>(selectedField?.type || 'text');

  // Update form when selected field changes
  useEffect(() => {
    if (selectedField) {
      setLabel(selectedField.label);
      setPlaceholder(selectedField.placeholder || '');
      setRequired(selectedField.required);
      setFieldType(selectedField.type);
    }
  }, [selectedField]);

  if (isPropertiesPanelCollapsed || !selectedField) {
    return null;
  }

  const handleSave = async () => {
    if (!currentTask || !selectedField) return;

    const updates = {
      label,
      placeholder: placeholder || undefined,
      required,
      type: fieldType,
    };

    try {
      // Update local state immediately
      updateField(selectedField.id, updates);

      // If it's a temp field, it will be saved when the task is saved
      // If it's an existing field, save to backend now
      if (currentTask.id && !selectedField.id.startsWith('temp-')) {
        await taskService.updateField(currentTask.id, selectedField.id, updates);

        // Reload the task to sync with backend
        const updatedTask = await taskService.getTask(currentTask.id);
        setCurrentTask(updatedTask);

        // Update selected field to match the reloaded data
        const updatedField = updatedTask.fields.find((f) => f.id === selectedField.id);
        if (updatedField) {
          setSelectedField(updatedField);
        }

        setHasUnsavedChanges(false);
        showToast({
          title: 'Field saved',
          description: 'Field properties have been updated.',
          status: 'success',
        });
      } else {
        // Temp field - changes are already in local state, will be saved with task
        setHasUnsavedChanges(true);
        showToast({
          title: 'Field changes saved locally',
          description: 'Click "Save" on the task to persist these changes.',
          status: 'warning',
        });
      }
    } catch (error: any) {
      console.error('Failed to save field:', error);
      const errorMessage =
        error?.response?.data?.error?.message || error?.message || 'Failed to save field';
      showToast({
        title: 'Failed to save field',
        description: errorMessage,
        status: 'error',
      });
    }
  };

  const handleClose = () => {
    setSelectedField(null);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 p-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Properties</h3>
        <button
          onClick={handleClose}
          className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Field Type */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Type</label>
          <select
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value as FieldType)}
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="dropdown">Dropdown</option>
            <option value="multi-select">Multi-Select</option>
            <option value="checkbox">Checkbox</option>
            <option value="file">File</option>
            <option value="image">Image</option>
            <option value="rich-text">Rich Text</option>
            <option value="field-group">Field Group</option>
          </select>
        </div>

        {/* Label */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
            Label <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Field label"
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Placeholder */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Placeholder</label>
          <input
            type="text"
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
            placeholder="Placeholder text"
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Required */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-600">Required field</span>
          </label>
        </div>

        {/* Field-specific options would go here based on type */}
        {(fieldType === 'dropdown' || fieldType === 'multi-select') && (
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Options</label>
            <textarea
              placeholder="Enter options, one per line"
              className="min-h-[80px] w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-0.5 text-[9px] text-slate-400">One option per line</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 p-3">
        <button
          onClick={handleSave}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
        >
          <Save className="w-3 h-3" />
          Save
        </button>
      </div>
    </div>
  );
}

