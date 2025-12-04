import { create } from 'zustand';
import type { ITask, ITaskField } from '../types/task.types';

interface TaskBuilderState {
  // Current task being edited
  currentTask: ITask | null;
  setCurrentTask: (task: ITask | null) => void;

  // Selected field for editing
  selectedField: ITaskField | null;
  setSelectedField: (field: ITaskField | null) => void;

  // Unsaved changes flag
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;

  // Field being dragged
  draggedField: ITaskField | null;
  setDraggedField: (field: ITaskField | null) => void;

  // Preview mode
  isPreviewMode: boolean;
  setIsPreviewMode: (value: boolean) => void;

  // Right panel collapsed state
  isPropertiesPanelCollapsed: boolean;
  setIsPropertiesPanelCollapsed: (value: boolean) => void;

  // Actions
  addField: (field: ITaskField) => void;
  updateField: (fieldId: string, updates: Partial<ITaskField>) => void;
  deleteField: (fieldId: string) => void;
  reorderFields: (fieldIds: string[]) => void;
}

export const useTaskBuilderStore = create<TaskBuilderState>((set) => ({
  currentTask: null,
  setCurrentTask: (task) => set({ currentTask: task }),

  selectedField: null,
  setSelectedField: (field) => set({ selectedField: field }),

  hasUnsavedChanges: false,
  setHasUnsavedChanges: (value) => set({ hasUnsavedChanges: value }),

  draggedField: null,
  setDraggedField: (field) => set({ draggedField: field }),

  isPreviewMode: false,
  setIsPreviewMode: (value) => set({ isPreviewMode: value }),

  isPropertiesPanelCollapsed: false,
  setIsPropertiesPanelCollapsed: (value) => set({ isPropertiesPanelCollapsed: value }),

  addField: (field) =>
    set((state) => {
      if (!state.currentTask) return state;
      return {
        currentTask: {
          ...state.currentTask,
          fields: [...state.currentTask.fields, field],
        },
        hasUnsavedChanges: true,
      };
    }),

  updateField: (fieldId, updates) =>
    set((state) => {
      if (!state.currentTask) return state;
      return {
        currentTask: {
          ...state.currentTask,
          fields: state.currentTask.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
        },
        hasUnsavedChanges: true,
      };
    }),

  deleteField: (fieldId) =>
    set((state) => {
      if (!state.currentTask) return state;
      return {
        currentTask: {
          ...state.currentTask,
          fields: state.currentTask.fields.filter((f) => f.id !== fieldId),
        },
        hasUnsavedChanges: true,
      };
    }),

  reorderFields: (fieldIds) =>
    set((state) => {
      if (!state.currentTask) return state;
      const fields = fieldIds.map((id) => state.currentTask!.fields.find((f) => f.id === id)!).filter(Boolean);
      return {
        currentTask: {
          ...state.currentTask,
          fields,
        },
        hasUnsavedChanges: true,
      };
    }),
}));

