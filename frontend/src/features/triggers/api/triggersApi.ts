import { apiClient, extractApiData, type ApiResponse, type PaginationParams, type ListResponse } from '@/lib/api-client';

// Types
export type EventType = 
  | 'TASK_CREATED' 
  | 'TASK_COMPLETED' 
  | 'TASK_UPDATED' 
  | 'FLOW_STARTED' 
  | 'FLOW_COMPLETED' 
  | 'FLOW_LEVEL_COMPLETED' 
  | 'CUSTOM_EVENT';

export type ActionType = 
  | 'EMAIL' 
  | 'FLOW' 
  | 'TASK' 
  | 'DATABASE' 
  | 'WEBHOOK' 
  | 'CUSTOM_API';

export interface TriggerAction {
  type: ActionType;
  config: Record<string, unknown>;
}

export interface Trigger {
  id: string;
  name: string;
  description?: string;
  eventType: EventType;
  eventEntityType?: 'TASK' | 'FLOW';
  eventEntityId?: string;
  conditions?: Record<string, unknown>;
  actions: TriggerAction[];
  isActive: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTriggerRequest {
  name: string;
  description?: string;
  eventType: EventType;
  eventEntityType?: 'TASK' | 'FLOW';
  eventEntityId?: string;
  conditions?: Record<string, unknown>;
  actions: TriggerAction[];
  isActive?: boolean;
}

export interface UpdateTriggerRequest {
  name?: string;
  description?: string;
  eventType?: EventType;
  eventEntityType?: 'TASK' | 'FLOW';
  eventEntityId?: string;
  conditions?: Record<string, unknown>;
  actions?: TriggerAction[];
  isActive?: boolean;
}

export interface TestTriggerRequest {
  testData?: Record<string, unknown>;
}

export interface TriggerExecution {
  id: string;
  triggerId: string;
  executedAt: string;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
  result?: Record<string, unknown>;
}

export interface ListTriggersParams extends PaginationParams {
  taskId?: string;
  flowId?: string;
  eventType?: EventType;
  isActive?: boolean;
}

// API functions
export const triggersApi = {
  /**
   * List triggers
   * GET /api/triggers
   */
  listTriggers: async (params?: ListTriggersParams): Promise<ListResponse<Trigger>> => {
    const response = await apiClient.get<ApiResponse<ListResponse<Trigger>>>('/triggers', { params });
    return extractApiData(response);
  },

  /**
   * Get trigger by ID
   * GET /api/triggers/:id
   */
  getTrigger: async (id: string): Promise<Trigger> => {
    const response = await apiClient.get<ApiResponse<Trigger>>(`/triggers/${id}`);
    return extractApiData(response);
  },

  /**
   * Create trigger
   * POST /api/triggers
   */
  createTrigger: async (data: CreateTriggerRequest): Promise<Trigger> => {
    const response = await apiClient.post<ApiResponse<Trigger>>('/triggers', data);
    return extractApiData(response);
  },

  /**
   * Update trigger
   * PUT /api/triggers/:id
   */
  updateTrigger: async (id: string, data: UpdateTriggerRequest): Promise<Trigger> => {
    const response = await apiClient.put<ApiResponse<Trigger>>(`/triggers/${id}`, data);
    return extractApiData(response);
  },

  /**
   * Delete trigger
   * DELETE /api/triggers/:id
   */
  deleteTrigger: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/triggers/${id}`);
  },

  /**
   * Test trigger
   * POST /api/triggers/:id/test
   */
  testTrigger: async (id: string, data?: TestTriggerRequest): Promise<Record<string, unknown>> => {
    const response = await apiClient.post<ApiResponse<Record<string, unknown>>>(`/triggers/${id}/test`, data);
    return extractApiData(response);
  },

  /**
   * Get trigger executions
   * GET /api/triggers/:id/executions
   */
  getTriggerExecutions: async (id: string, params?: PaginationParams): Promise<ListResponse<TriggerExecution>> => {
    const response = await apiClient.get<ApiResponse<ListResponse<TriggerExecution>>>(`/triggers/${id}/executions`, { params });
    return extractApiData(response);
  },
};

