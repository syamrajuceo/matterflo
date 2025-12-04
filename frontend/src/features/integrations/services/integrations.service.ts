import axios from 'axios';

export interface IIntegration {
  id: string;
  name: string;
  type: 'GMAIL' | 'GOOGLE_SHEETS' | 'OUTLOOK' | 'WEBHOOK' | 'CUSTOM_API';
  isActive: boolean;
  config: Record<string, unknown>;
  companyId: string;
  workflows: IIntegrationWorkflow[];
  createdAt: string;
  updatedAt: string;
  lastSyncAt?: string;
}

export interface IIntegrationWorkflow {
  id: string;
  name: string;
  triggerConfig: ITriggerConfig;
  actionConfig: IActionConfig;
  isActive: boolean;
}

export interface ITriggerConfig {
  event: string;
  filters?: Record<string, unknown>;
}

export interface IActionConfig {
  action: string;
  params?: Record<string, unknown>;
}

export interface CreateIntegrationRequest {
  name: string;
  type: string;
  config?: Record<string, unknown>;
}

export interface CreateWorkflowRequest {
  name: string;
  triggerConfig: ITriggerConfig;
  actionConfig: IActionConfig;
  isActive?: boolean;
}

class IntegrationsService {
  async listIntegrations(): Promise<IIntegration[]> {
    const response = await axios.get<{ success: true; data: IIntegration[] }>('/integrations');
    return response.data.data;
  }

  async getIntegration(id: string): Promise<IIntegration> {
    const response = await axios.get<{ success: true; data: IIntegration }>(`/integrations/${id}`);
    return response.data.data;
  }

  async createIntegration(data: CreateIntegrationRequest): Promise<IIntegration> {
    const response = await axios.post<{ success: true; data: IIntegration }>('/integrations', data);
    return response.data.data;
  }

  async deleteIntegration(id: string): Promise<void> {
    await axios.delete(`/integrations/${id}`);
  }

  // Gmail OAuth
  async connectGmail(): Promise<void> {
    // Redirect to OAuth flow
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/integrations/gmail/connect`;
  }

  async handleGmailCallback(code: string): Promise<IIntegration> {
    const response = await axios.post<{ success: true; data: IIntegration }>(
      '/integrations/gmail/callback',
      { code }
    );
    return response.data.data;
  }

  // Workflows
  async createWorkflow(
    integrationId: string,
    workflow: CreateWorkflowRequest
  ): Promise<IIntegrationWorkflow> {
    const response = await axios.post<{ success: true; data: IIntegrationWorkflow }>(
      `/integrations/${integrationId}/workflows`,
      workflow
    );
    return response.data.data;
  }

  async listWorkflows(integrationId: string): Promise<IIntegrationWorkflow[]> {
    const response = await axios.get<{ success: true; data: IIntegrationWorkflow[] }>(
      `/integrations/${integrationId}/workflows`
    );
    return response.data.data;
  }

  async updateWorkflow(
    integrationId: string,
    workflowId: string,
    data: Partial<CreateWorkflowRequest>
  ): Promise<IIntegrationWorkflow> {
    const response = await axios.put<{ success: true; data: IIntegrationWorkflow }>(
      `/integrations/${integrationId}/workflows/${workflowId}`,
      data
    );
    return response.data.data;
  }

  async deleteWorkflow(integrationId: string, workflowId: string): Promise<void> {
    await axios.delete(`/integrations/${integrationId}/workflows/${workflowId}`);
  }

  async testWorkflow(
    integrationId: string,
    workflowId: string,
    testData: Record<string, unknown>
  ): Promise<{ success: boolean; result: unknown }> {
    const response = await axios.post<{ success: true; data: { success: boolean; result: unknown } }>(
      `/integrations/${integrationId}/workflows/${workflowId}/test`,
      testData
    );
    return response.data.data;
  }
}

export const integrationsService = new IntegrationsService();

