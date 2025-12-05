import { apiClient, extractApiData, type ApiResponse, type ListResponse } from '@/lib/api-client';

// Types
export type IntegrationType = 
  | 'GMAIL' 
  | 'GOOGLE_SHEETS' 
  | 'OUTLOOK' 
  | 'WEBHOOK' 
  | 'CUSTOM_API';

export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  config: Record<string, unknown>;
  isActive: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationWorkflow {
  id: string;
  integrationId: string;
  name: string;
  trigger: Record<string, unknown>;
  actions: Record<string, unknown>[];
  isActive: boolean;
}

export interface CreateIntegrationRequest {
  name: string;
  type: IntegrationType;
  config: Record<string, unknown>;
  isActive?: boolean;
}

export interface CreateWorkflowRequest {
  name: string;
  trigger: Record<string, unknown>;
  actions: Record<string, unknown>[];
  isActive?: boolean;
}

export interface TestWorkflowRequest {
  testData?: Record<string, unknown>;
}

// API functions
export const integrationsApi = {
  /**
   * List integrations
   * GET /api/integrations
   */
  listIntegrations: async (): Promise<Integration[]> => {
    const response = await apiClient.get<ApiResponse<Integration[]>>('/integrations');
    return extractApiData(response);
  },

  /**
   * Get integration by ID
   * GET /api/integrations/:id
   */
  getIntegration: async (id: string): Promise<Integration> => {
    const response = await apiClient.get<ApiResponse<Integration>>(`/integrations/${id}`);
    return extractApiData(response);
  },

  /**
   * Create integration
   * POST /api/integrations
   */
  createIntegration: async (data: CreateIntegrationRequest): Promise<Integration> => {
    const response = await apiClient.post<ApiResponse<Integration>>('/integrations', data);
    return extractApiData(response);
  },

  /**
   * Delete integration
   * DELETE /api/integrations/:id
   */
  deleteIntegration: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/integrations/${id}`);
  },

  // Workflow operations
  /**
   * Create workflow
   * POST /api/integrations/:id/workflows
   */
  createWorkflow: async (id: string, data: CreateWorkflowRequest): Promise<IntegrationWorkflow> => {
    const response = await apiClient.post<ApiResponse<IntegrationWorkflow>>(`/integrations/${id}/workflows`, data);
    return extractApiData(response);
  },

  /**
   * Test workflow
   * POST /api/integrations/:id/workflows/:workflowId/test
   */
  testWorkflow: async (id: string, workflowId: string, data?: TestWorkflowRequest): Promise<Record<string, unknown>> => {
    const response = await apiClient.post<ApiResponse<Record<string, unknown>>>(`/integrations/${id}/workflows/${workflowId}/test`, data);
    return extractApiData(response);
  },
};

