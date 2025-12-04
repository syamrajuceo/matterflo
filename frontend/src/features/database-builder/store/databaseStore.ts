import { create } from 'zustand';
import type { ICustomTable, ITableRecord, ITableField } from '../types/database.types';

interface DatabaseState {
  tables: ICustomTable[];
  currentTable: ICustomTable | null;
  currentRecords: ITableRecord[];
  selectedField: ITableField | null;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
  activeTab: 'schema' | 'data';

  // Actions
  setTables: (tables: ICustomTable[]) => void;
  setCurrentTable: (table: ICustomTable | null) => void;
  setCurrentRecords: (records: ITableRecord[]) => void;
  setSelectedField: (field: ITableField | null) => void;
  setIsLoading: (loading: boolean) => void;
  setHasUnsavedChanges: (value: boolean) => void;
  setActiveTab: (tab: 'schema' | 'data') => void;

  // Field actions
  addField: (field: ITableField) => void;
  updateField: (fieldId: string, updates: Partial<ITableField>) => void;
  deleteField: (fieldId: string) => void;
  reorderFields: (fieldIds: string[]) => void;

  // Record actions
  addRecord: (record: ITableRecord) => void;
  updateRecord: (recordId: string, updates: Record<string, any>) => void;
  deleteRecord: (recordId: string) => void;
}

export const useDatabaseStore = create<DatabaseState>((set) => ({
  tables: [],
  currentTable: null,
  currentRecords: [],
  selectedField: null,
  isLoading: false,
  hasUnsavedChanges: false,
  activeTab: 'schema',

  setTables: (tables) => set({ tables }),
  setCurrentTable: (table) => set({ currentTable: table }),
  setCurrentRecords: (records) => set({ currentRecords: records }),
  setSelectedField: (field) => set({ selectedField: field }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setHasUnsavedChanges: (value) => set({ hasUnsavedChanges: value }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  addField: (field) =>
    set((state) => {
      if (!state.currentTable) return state;
      return {
        currentTable: {
          ...state.currentTable,
          schema: {
            ...state.currentTable.schema,
            fields: [...state.currentTable.schema.fields, field],
          },
        },
        hasUnsavedChanges: true,
      };
    }),

  updateField: (fieldId, updates) =>
    set((state) => {
      if (!state.currentTable) return state;
      return {
        currentTable: {
          ...state.currentTable,
          schema: {
            ...state.currentTable.schema,
            fields: state.currentTable.schema.fields.map((f) =>
              f.id === fieldId ? { ...f, ...updates } : f
            ),
          },
        },
        hasUnsavedChanges: true,
      };
    }),

  deleteField: (fieldId) =>
    set((state) => {
      if (!state.currentTable) return state;
      return {
        currentTable: {
          ...state.currentTable,
          schema: {
            ...state.currentTable.schema,
            fields: state.currentTable.schema.fields.filter((f) => f.id !== fieldId),
          },
        },
        hasUnsavedChanges: true,
      };
    }),

  reorderFields: (fieldIds) =>
    set((state) => {
      if (!state.currentTable) return state;
      const fields = fieldIds
        .map((id) => state.currentTable!.schema.fields.find((f) => f.id === id))
        .filter(Boolean) as ITableField[];
      return {
        currentTable: {
          ...state.currentTable,
          schema: {
            ...state.currentTable.schema,
            fields,
          },
        },
        hasUnsavedChanges: true,
      };
    }),

  addRecord: (record) =>
    set((state) => ({
      currentRecords: [...state.currentRecords, record],
      hasUnsavedChanges: true,
    })),

  updateRecord: (recordId, updates) =>
    set((state) => ({
      currentRecords: state.currentRecords.map((r) =>
        r.id === recordId ? { ...r, data: { ...r.data, ...updates }, updatedAt: new Date().toISOString() } : r
      ),
      hasUnsavedChanges: true,
    })),

  deleteRecord: (recordId) =>
    set((state) => ({
      currentRecords: state.currentRecords.filter((r) => r.id !== recordId),
      hasUnsavedChanges: true,
    })),
}));

