import { apiClient, extractApiData, type ApiResponse, type ListResponse } from '@/lib/api-client';
import type { TaskExecution, FlowInstance } from '@/features/execution/api/executionApi';

// Types
export interface ClientDashboardStats {
  pendingTasks: number;
  completedTasks: number;
  activeFlows: number;
  completedFlows: number;
}

export interface CompleteTaskRequest {
  data: Record<string, unknown>;
}

// API functions
export const clientApi = {
  /**
   * Get client dashboard statistics
   * GET /api/client/dashboard
   */
  getDashboard: async (): Promise<ClientDashboardStats> => {
    const response = await apiClient.get<ApiResponse<ClientDashboardStats>>('/client/dashboard');
    return extractApiData(response);
  },

  /**
   * Get pending tasks
   * GET /api/client/tasks/pending
   */
  getPendingTasks: async (): Promise<TaskExecution[]> => {
    const response = await apiClient.get<ApiResponse<TaskExecution[]>>('/client/tasks/pending');
    return extractApiData(response);
  },

  /**
   * Get all tasks
   * GET /api/client/tasks
   */
  getTasks: async (): Promise<TaskExecution[]> => {
    const response = await apiClient.get<ApiResponse<TaskExecution[]>>('/client/tasks');
    return extractApiData(response);
  },

  /**
   * Get task execution details
   * GET /api/client/tasks/:id
   */
  getTask: async (id: string): Promise<TaskExecution> => {
    const response = await apiClient.get<ApiResponse<TaskExecution>>(`/client/tasks/${id}`);
    return extractApiData(response);
  },

  /**
   * Submit task
   * POST /api/client/tasks/:id/submit
   */
  submitTask: async (id: string, data: CompleteTaskRequest): Promise<TaskExecution> => {
    const response = await apiClient.post<ApiResponse<TaskExecution>>(`/client/tasks/${id}/submit`, data);
    return extractApiData(response);
  },

  /**
   * Complete task
   * POST /api/client/tasks/:id/complete
   */
  completeTask: async (id: string, data: CompleteTaskRequest): Promise<void> => {
    await apiClient.post<ApiResponse<void>>(`/client/tasks/${id}/complete`, data);
  },

  /**
   * Get my flow instances
   * GET /api/client/flows
   */
  getFlows: async (): Promise<FlowInstance[]> => {
    const response = await apiClient.get<ApiResponse<FlowInstance[]>>('/client/flows');
    return extractApiData(response);
  },

  /**
   * Get flow instance details
   * GET /api/client/flows/:id
   */
  getFlowInstance: async (id: string): Promise<FlowInstance> => {
    const response = await apiClient.get<ApiResponse<FlowInstance>>(`/client/flows/${id}`);
    return extractApiData(response);
  },
};

