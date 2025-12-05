import { apiClient, extractApiData, type ApiResponse, type PaginationParams, type ListResponse } from '@/lib/api-client';

// Types
export type FlowStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface FlowLevel {
  id: string;
  name: string;
  description?: string;
  order: number;
  tasks: FlowLevelTask[];
  roles: FlowLevelRole[];
}

export interface FlowLevelTask {
  id: string;
  taskId: string;
  task: {
    id: string;
    name: string;
  };
  order: number;
}

export interface FlowLevelRole {
  id: string;
  roleId: string;
  role: {
    id: string;
    name: string;
  };
}

export interface FlowBranch {
  id: string;
  name: string;
  fromLevelId: string;
  toLevelId: string;
  conditions: Record<string, unknown>;
}

export interface Flow {
  id: string;
  name: string;
  description?: string;
  status: FlowStatus;
  version: string;
  levels: FlowLevel[];
  branches: FlowBranch[];
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFlowRequest {
  name: string;
  description?: string;
}

export interface UpdateFlowRequest {
  name?: string;
  description?: string;
  status?: FlowStatus;
}

export interface CreateLevelRequest {
  name: string;
  description?: string;
}

export interface UpdateLevelRequest {
  name?: string;
  description?: string;
}

export interface ReorderLevelsRequest {
  levelIds: string[];
}

export interface AddTaskToLevelRequest {
  taskId: string;
}

export interface ReorderTasksInLevelRequest {
  taskIds: string[];
}

export interface CreateBranchRequest {
  name: string;
  fromLevelId: string;
  toLevelId: string;
  conditions: Record<string, unknown>;
}

export interface UpdateBranchRequest {
  name?: string;
  fromLevelId?: string;
  toLevelId?: string;
  conditions?: Record<string, unknown>;
}

export interface AddRoleToLevelRequest {
  roleId: string;
}

export interface DuplicateFlowRequest {
  name: string;
}

export interface ListFlowsParams extends PaginationParams {
  status?: FlowStatus;
  search?: string;
}

// API functions
export const flowsApi = {
  /**
   * List flows
   * GET /api/flows
   */
  listFlows: async (params?: ListFlowsParams): Promise<ListResponse<Flow>> => {
    const response = await apiClient.get<ApiResponse<ListResponse<Flow>>>('/flows', { params });
    return extractApiData(response);
  },

  /**
   * Get flow by ID
   * GET /api/flows/:id
   */
  getFlow: async (id: string): Promise<Flow> => {
    const response = await apiClient.get<ApiResponse<Flow>>(`/flows/${id}`);
    return extractApiData(response);
  },

  /**
   * Create a new flow
   * POST /api/flows
   */
  createFlow: async (data: CreateFlowRequest): Promise<Flow> => {
    const response = await apiClient.post<ApiResponse<Flow>>('/flows', data);
    return extractApiData(response);
  },

  /**
   * Update flow
   * PUT /api/flows/:id
   */
  updateFlow: async (id: string, data: UpdateFlowRequest): Promise<Flow> => {
    const response = await apiClient.put<ApiResponse<Flow>>(`/flows/${id}`, data);
    return extractApiData(response);
  },

  /**
   * Delete flow
   * DELETE /api/flows/:id
   */
  deleteFlow: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/flows/${id}`);
  },

  /**
   * Publish flow
   * POST /api/flows/:id/publish
   */
  publishFlow: async (id: string): Promise<Flow> => {
    const response = await apiClient.post<ApiResponse<Flow>>(`/flows/${id}/publish`);
    return extractApiData(response);
  },

  /**
   * Duplicate flow
   * POST /api/flows/:id/duplicate
   */
  duplicateFlow: async (id: string, data: DuplicateFlowRequest): Promise<Flow> => {
    const response = await apiClient.post<ApiResponse<Flow>>(`/flows/${id}/duplicate`, data);
    return extractApiData(response);
  },

  // Level operations
  /**
   * Add level to flow
   * POST /api/flows/:id/levels
   */
  addLevel: async (id: string, data: CreateLevelRequest): Promise<FlowLevel> => {
    const response = await apiClient.post<ApiResponse<FlowLevel>>(`/flows/${id}/levels`, data);
    return extractApiData(response);
  },

  /**
   * Update level
   * PUT /api/flows/:id/levels/:levelId
   */
  updateLevel: async (id: string, levelId: string, data: UpdateLevelRequest): Promise<FlowLevel> => {
    const response = await apiClient.put<ApiResponse<FlowLevel>>(`/flows/${id}/levels/${levelId}`, data);
    return extractApiData(response);
  },

  /**
   * Delete level
   * DELETE /api/flows/:id/levels/:levelId
   */
  deleteLevel: async (id: string, levelId: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/flows/${id}/levels/${levelId}`);
  },

  /**
   * Reorder levels
   * PUT /api/flows/:id/levels/reorder
   */
  reorderLevels: async (id: string, data: ReorderLevelsRequest): Promise<void> => {
    await apiClient.put<ApiResponse<void>>(`/flows/${id}/levels/reorder`, data);
  },

  // Task assignment to level
  /**
   * Add task to level
   * POST /api/flows/:id/levels/:levelId/tasks
   */
  addTaskToLevel: async (id: string, levelId: string, data: AddTaskToLevelRequest): Promise<FlowLevelTask> => {
    const response = await apiClient.post<ApiResponse<FlowLevelTask>>(`/flows/${id}/levels/${levelId}/tasks`, data);
    return extractApiData(response);
  },

  /**
   * Remove task from level
   * DELETE /api/flows/:id/levels/:levelId/tasks/:taskId
   */
  removeTaskFromLevel: async (id: string, levelId: string, taskId: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/flows/${id}/levels/${levelId}/tasks/${taskId}`);
  },

  /**
   * Reorder tasks in level
   * PUT /api/flows/:id/levels/:levelId/tasks/reorder
   */
  reorderTasksInLevel: async (id: string, levelId: string, data: ReorderTasksInLevelRequest): Promise<void> => {
    await apiClient.put<ApiResponse<void>>(`/flows/${id}/levels/${levelId}/tasks/reorder`, data);
  },

  // Role assignment to level
  /**
   * Add role to level
   * POST /api/flows/:id/levels/:levelId/roles
   */
  addRoleToLevel: async (id: string, levelId: string, data: AddRoleToLevelRequest): Promise<FlowLevelRole> => {
    const response = await apiClient.post<ApiResponse<FlowLevelRole>>(`/flows/${id}/levels/${levelId}/roles`, data);
    return extractApiData(response);
  },

  /**
   * Remove role from level
   * DELETE /api/flows/:id/levels/:levelId/roles/:roleId
   */
  removeRoleFromLevel: async (id: string, levelId: string, roleId: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/flows/${id}/levels/${levelId}/roles/${roleId}`);
  },

  // Branch operations
  /**
   * Create branch
   * POST /api/flows/:id/branches
   */
  createBranch: async (id: string, data: CreateBranchRequest): Promise<FlowBranch> => {
    const response = await apiClient.post<ApiResponse<FlowBranch>>(`/flows/${id}/branches`, data);
    return extractApiData(response);
  },

  /**
   * Update branch
   * PUT /api/flows/:id/branches/:branchId
   */
  updateBranch: async (id: string, branchId: string, data: UpdateBranchRequest): Promise<FlowBranch> => {
    const response = await apiClient.put<ApiResponse<FlowBranch>>(`/flows/${id}/branches/${branchId}`, data);
    return extractApiData(response);
  },

  /**
   * Delete branch
   * DELETE /api/flows/:id/branches/:branchId
   */
  deleteBranch: async (id: string, branchId: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/flows/${id}/branches/${branchId}`);
  },
};

