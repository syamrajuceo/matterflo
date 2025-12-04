import { useTaskBuilderStore } from '../store/taskBuilderStore';
import type { ITaskField } from '../types/task.types';

function PreviewField({ field }: { field: ITaskField }) {
  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            placeholder={field.placeholder || 'Enter text...'}
            disabled
            className="w-full rounded-lg border bg-card px-4 py-2 placeholder:text-muted-foreground"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            placeholder={field.placeholder || 'Enter number...'}
            disabled
            className="w-full rounded-lg border bg-card px-4 py-2 placeholder:text-muted-foreground"
          />
        );
      case 'date':
        return (
          <input
            type="date"
            disabled
            className="w-full rounded-lg border bg-card px-4 py-2"
          />
        );
      case 'dropdown':
        return (
          <select
            disabled
            className="w-full rounded-lg border bg-card px-4 py-2"
          >
            <option>Select an option...</option>
            {field.validation?.options?.map((opt, idx) => (
              <option key={idx} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      case 'multi-select':
        return (
          <div className="space-y-2">
            {field.validation?.options?.map((opt, idx) => (
              <label key={idx} className="flex items-center gap-2 cursor-not-allowed">
                <input type="checkbox" disabled className="w-4 h-4" />
                <span className="text-gray-300">{opt}</span>
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-not-allowed">
            <input type="checkbox" disabled className="w-4 h-4" />
            <span className="text-gray-300">Check this option</span>
          </label>
        );
      case 'file':
        return (
          <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground">Click to upload file</p>
          </div>
        );
      case 'image':
        return (
          <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground">Click to upload image</p>
          </div>
        );
      case 'rich-text':
        return (
          <div className="min-h-[150px] w-full rounded-lg border bg-card px-4 py-2">
            <p className="text-muted-foreground">Rich text editor</p>
          </div>
        );
      case 'field-group':
        return (
          <div className="rounded-lg border bg-card p-4">
            <p className="text-muted-foreground">Field group</p>
          </div>
        );
      default:
        return (
          <input
            type="text"
            placeholder="Field preview"
            disabled
            className="w-full rounded-lg border bg-card px-4 py-2 placeholder:text-muted-foreground"
          />
        );
    }
  };

  return (
    <div className="mb-6">
      <label className="mb-2 block text-sm font-medium text-foreground">
        {field.label}
        {field.required && <span className="ml-1 text-destructive">*</span>}
      </label>
      {renderField()}
    </div>
  );
}

export function TaskPreview() {
  const { currentTask } = useTaskBuilderStore();

  if (!currentTask) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="text-center">
          <p className="mb-4 text-muted-foreground">No task selected</p>
          <p className="text-sm text-muted-foreground">Select a task to preview</p>
        </div>
      </div>
    );
  }

  const sortedFields = [...currentTask.fields].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="border-b p-6">
        <h2 className="mb-2 text-2xl font-semibold text-foreground">{currentTask.name}</h2>
        {currentTask.description && (
          <p className="text-muted-foreground">{currentTask.description}</p>
        )}
      </div>

      {/* Preview Form */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl">
          {sortedFields.length === 0 ? (
            <div className="py-12 text-center">
              <p className="mb-2 text-muted-foreground">No fields to preview</p>
              <p className="text-sm text-muted-foreground">Add fields to see the preview</p>
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-6">
              {sortedFields.map((field) => (
                <PreviewField key={field.id} field={field} />
              ))}
              <div className="mt-6 border-t pt-6">
                <button
                  disabled
                  className="w-full px-4 py-2 bg-blue-600/50 text-white rounded-lg cursor-not-allowed"
                >
                  Submit (Preview Mode)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

