import { apiClient, extractApiData, type ApiResponse, type PaginationParams, type ListResponse } from '@/lib/api-client';

// Types
export type TaskStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DEPRECATED';

export type FieldType = 
  | 'text' 
  | 'number' 
  | 'date' 
  | 'dropdown' 
  | 'multi-select' 
  | 'checkbox' 
  | 'file' 
  | 'image' 
  | 'rich-text' 
  | 'field-group';

export interface TaskField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: Record<string, unknown>;
  conditionalLogic?: Record<string, unknown>;
  order: number;
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  version: string;
  status: TaskStatus;
  fields: TaskField[];
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  name: string;
  description?: string;
}

export interface UpdateTaskRequest {
  name?: string;
  description?: string;
  status?: TaskStatus;
}

export interface AddFieldRequest {
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  validation?: Record<string, unknown>;
  conditionalLogic?: Record<string, unknown>;
}

export interface UpdateFieldRequest {
  type?: FieldType;
  label?: string;
  placeholder?: string;
  required?: boolean;
  validation?: Record<string, unknown>;
  conditionalLogic?: Record<string, unknown>;
}

export interface ReorderFieldsRequest {
  fieldIds: string[];
}

export interface DuplicateTaskRequest {
  name: string;
}

export interface ListTasksParams extends PaginationParams {
  status?: TaskStatus;
  search?: string;
}

// API functions
export const tasksApi = {
  /**
   * List tasks
   * GET /api/tasks
   */
  listTasks: async (params?: ListTasksParams): Promise<ListResponse<Task>> => {
    const response = await apiClient.get<ApiResponse<ListResponse<Task>>>('/tasks', { params });
    return extractApiData(response);
  },

  /**
   * Get task by ID
   * GET /api/tasks/:id
   */
  getTask: async (id: string): Promise<Task> => {
    const response = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`);
    return extractApiData(response);
  },

  /**
   * Create a new task
   * POST /api/tasks
   */
  createTask: async (data: CreateTaskRequest): Promise<Task> => {
    const response = await apiClient.post<ApiResponse<Task>>('/tasks', data);
    return extractApiData(response);
  },

  /**
   * Update task
   * PUT /api/tasks/:id
   */
  updateTask: async (id: string, data: UpdateTaskRequest): Promise<Task> => {
    const response = await apiClient.put<ApiResponse<Task>>(`/tasks/${id}`, data);
    return extractApiData(response);
  },

  /**
   * Delete task
   * DELETE /api/tasks/:id
   */
  deleteTask: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/tasks/${id}`);
  },

  /**
   * Publish task
   * POST /api/tasks/:id/publish
   */
  publishTask: async (id: string): Promise<Task> => {
    const response = await apiClient.post<ApiResponse<Task>>(`/tasks/${id}/publish`);
    return extractApiData(response);
  },

  /**
   * Duplicate task
   * POST /api/tasks/:id/duplicate
   */
  duplicateTask: async (id: string, data: DuplicateTaskRequest): Promise<Task> => {
    const response = await apiClient.post<ApiResponse<Task>>(`/tasks/${id}/duplicate`, data);
    return extractApiData(response);
  },

  /**
   * Add field to task
   * POST /api/tasks/:id/fields
   */
  addField: async (id: string, data: AddFieldRequest): Promise<TaskField> => {
    const response = await apiClient.post<ApiResponse<TaskField>>(`/tasks/${id}/fields`, data);
    return extractApiData(response);
  },

  /**
   * Update field
   * PUT /api/tasks/:id/fields/:fieldId
   */
  updateField: async (id: string, fieldId: string, data: UpdateFieldRequest): Promise<TaskField> => {
    const response = await apiClient.put<ApiResponse<TaskField>>(`/tasks/${id}/fields/${fieldId}`, data);
    return extractApiData(response);
  },

  /**
   * Delete field
   * DELETE /api/tasks/:id/fields/:fieldId
   */
  deleteField: async (id: string, fieldId: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/tasks/${id}/fields/${fieldId}`);
  },

  /**
   * Reorder fields
   * PUT /api/tasks/:id/fields/reorder
   */
  reorderFields: async (id: string, data: ReorderFieldsRequest): Promise<void> => {
    await apiClient.put<ApiResponse<void>>(`/tasks/${id}/fields/reorder`, data);
  },
};

