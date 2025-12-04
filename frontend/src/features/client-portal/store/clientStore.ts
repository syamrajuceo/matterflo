import { create } from 'zustand';
import { clientService } from '../services/client.service';
import type { IClientDashboardStats, IClientTask, IClientTaskSummary } from '../services/client.types';

interface ClientState {
  // Dashboard
  stats: IClientDashboardStats | null;

  // Tasks
  tasks: IClientTaskSummary[];
  pendingTasks: IClientTask[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadDashboard: () => Promise<void>;
  loadTasks: () => Promise<void>;
  loadPendingTasks: () => Promise<void>;
  setPendingTasks: (tasks: IClientTask[]) => void;
  setError: (message: string | null) => void;
}

export const useClientStore = create<ClientState>((set, get) => ({
  stats: null,
  tasks: [],
  pendingTasks: [],
  isLoading: false,
  error: null,

  async loadDashboard() {
    try {
      set({ isLoading: true, error: null });
      const stats = await clientService.getDashboardStats();
      set({ stats });
    } catch (error) {
      console.error('Failed to load client dashboard stats', error);
      set({ error: 'Failed to load dashboard stats' });
    } finally {
      if (get().isLoading) {
        set({ isLoading: false });
      }
    }
  },

  async loadTasks() {
    try {
      set({ isLoading: true, error: null });
      const tasks = await clientService.getMyTasks();
      set({ tasks });
    } catch (error) {
      console.error('Failed to load client tasks', error);
      set({ error: 'Failed to load tasks' });
    } finally {
      if (get().isLoading) {
        set({ isLoading: false });
      }
    }
  },

  async loadPendingTasks() {
    try {
      set({ isLoading: true, error: null });
      const response = await clientService.getPendingTasks();
      set({ pendingTasks: response.tasks });
    } catch (error) {
      console.error('Failed to load client pending tasks from store', error);
      set({ error: 'Failed to load pending tasks' });
    } finally {
      if (get().isLoading) {
        set({ isLoading: false });
      }
    }
  },

  setPendingTasks(tasks) {
    set({ pendingTasks: tasks });
  },

  setError(message) {
    set({ error: message });
  },
}));

