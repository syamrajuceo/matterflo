import { apiClient, extractApiData, type ApiResponse, type PaginationParams, type ListResponse } from '@/lib/api-client';

// Types
export type TaskExecutionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface TaskExecution {
  id: string;
  taskId: string;
  task: {
    id: string;
    name: string;
    description?: string;
    fields: unknown[];
  };
  executorId: string;
  executor: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  data?: Record<string, unknown>;
  status: TaskExecutionStatus;
  assignedAt: string;
  completedAt?: string;
  dueDate?: string;
  flowInstanceId?: string;
}

export interface CreateTaskExecutionRequest {
  taskId: string;
  executorId: string;
  dueDate?: string;
  contextData?: Record<string, unknown>;
}

export interface UpdateTaskExecutionRequest {
  data?: Record<string, unknown>;
  status?: TaskExecutionStatus;
}

export interface FlowInstance {
  id: string;
  flowId: string;
  flow: {
    id: string;
    name: string;
    description?: string;
  };
  startedBy: string;
  starter: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  contextData?: Record<string, unknown>;
  currentLevelId?: string;
  currentLevel?: {
    id: string;
    name: string;
    order: number;
  };
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
  startedAt: string;
  completedAt?: string;
  taskExecutions: TaskExecution[];
}

export interface CreateFlowInstanceRequest {
  flowId: string;
  contextData?: Record<string, unknown>;
}

export interface ListTaskExecutionsParams extends PaginationParams {
  status?: TaskExecutionStatus;
}

// API functions
export const executionApi = {
  // Task Execution
  /**
   * Create task execution
   * POST /api/executions/tasks
   */
  createTaskExecution: async (data: CreateTaskExecutionRequest): Promise<TaskExecution> => {
    const response = await apiClient.post<ApiResponse<TaskExecution>>('/executions/tasks', data);
    return extractApiData(response);
  },

  /**
   * Get my pending tasks
   * GET /api/executions/tasks/my-tasks
   */
  getMyTasks: async (params?: ListTaskExecutionsParams): Promise<ListResponse<TaskExecution>> => {
    const response = await apiClient.get<ApiResponse<ListResponse<TaskExecution>>>('/executions/tasks/my-tasks', { params });
    return extractApiData(response);
  },

  /**
   * Get task execution by ID
   * GET /api/executions/tasks/:id
   */
  getTaskExecution: async (id: string): Promise<TaskExecution> => {
    const response = await apiClient.get<ApiResponse<TaskExecution>>(`/executions/tasks/${id}`);
    return extractApiData(response);
  },

  /**
   * Update task execution (submit response)
   * PUT /api/executions/tasks/:id
   */
  updateTaskExecution: async (id: string, data: UpdateTaskExecutionRequest): Promise<TaskExecution> => {
    const response = await apiClient.put<ApiResponse<TaskExecution>>(`/executions/tasks/${id}`, data);
    return extractApiData(response);
  },

  // Flow Instance
  /**
   * Create flow instance (start workflow)
   * POST /api/executions/flows
   */
  createFlowInstance: async (data: CreateFlowInstanceRequest): Promise<FlowInstance> => {
    const response = await apiClient.post<ApiResponse<FlowInstance>>('/executions/flows', data);
    return extractApiData(response);
  },

  /**
   * Get my flow instances
   * GET /api/executions/flows/my-flows
   */
  getMyFlows: async (params?: PaginationParams): Promise<ListResponse<FlowInstance>> => {
    const response = await apiClient.get<ApiResponse<ListResponse<FlowInstance>>>('/executions/flows/my-flows', { params });
    return extractApiData(response);
  },

  /**
   * Get flow instance by ID
   * GET /api/executions/flows/:id
   */
  getFlowInstance: async (id: string): Promise<FlowInstance> => {
    const response = await apiClient.get<ApiResponse<FlowInstance>>(`/executions/flows/${id}`);
    return extractApiData(response);
  },
};

