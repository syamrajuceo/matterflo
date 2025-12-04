import { create } from 'zustand';
import type { IAuditLog, IGetLogsParams } from '../services/audit.service';

interface AuditState {
  logs: IAuditLog[];
  selectedLog: IAuditLog | null;
  filters: IGetLogsParams;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setLogs: (logs: IAuditLog[]) => void;
  setSelectedLog: (log: IAuditLog | null) => void;
  setFilters: (filters: Partial<IGetLogsParams>) => void;
  resetFilters: () => void;
  setPagination: (pagination: Partial<AuditState['pagination']>) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

const defaultFilters: IGetLogsParams = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const useAuditStore = create<AuditState>((set) => ({
  logs: [],
  selectedLog: null,
  filters: defaultFilters,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  isLoading: false,
  error: null,

  setLogs: (logs) => set({ logs }),
  setSelectedLog: (log) => set({ selectedLog: log }),
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters, page: 1 }, // Reset to page 1 when filters change
    })),
  resetFilters: () => set({ filters: defaultFilters }),
  setPagination: (newPagination) =>
    set((state) => ({
      pagination: { ...state.pagination, ...newPagination },
    })),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

