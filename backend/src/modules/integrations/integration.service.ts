import { prisma } from '../../common/config/database.config';
import { NotFoundError, ValidationError } from '../../common/errors';
import type {
  IIntegration,
  IIntegrationWorkflow,
  ITriggerConfig,
  IActionConfig,
} from './integration.types';
import { webhookConnector } from './connectors/webhook.connector';

class IntegrationService {
  private mapIntegration(integration: any, workflows?: any[]): IIntegration {
    return {
      id: integration.id,
      name: integration.name,
      type: integration.type as any,
      isActive: integration.isActive,
      config: (integration.config as any) || {},
      companyId: integration.companyId,
      workflows:
        (workflows ?? integration.workflows ?? []).map((wf: any) => this.mapWorkflow(wf)) || [],
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
      lastSyncAt: integration.lastSyncAt ?? undefined,
    };
  }

  private mapWorkflow(workflow: any): IIntegrationWorkflow {
    return {
      id: workflow.id,
      name: workflow.name,
      triggerConfig: (workflow.triggerConfig as any) || {},
      actionConfig: (workflow.actionConfig as any) || {},
      isActive: workflow.isActive,
    };
  }

  // Create integration
  async createIntegration(data: {
    name: string;
    type: string;
    config: any;
    companyId: string;
    baseUrl: string;
  }): Promise<IIntegration & { webhookUrl?: string }> {
    const supportedTypes = ['GMAIL', 'GOOGLE_SHEETS', 'OUTLOOK', 'WEBHOOK', 'CUSTOM_API'];
    if (!supportedTypes.includes(data.type)) {
      throw new ValidationError('Unsupported integration type', { type: data.type });
    }

    const company = await prisma.company.findUnique({
      where: { id: data.companyId },
    });
    if (!company) {
      throw new NotFoundError('Company');
    }

    const integration = await prisma.integration.create({
      data: {
        name: data.name,
        type: data.type as any,
        isActive: true,
        config: data.config || {},
        companyId: data.companyId,
      },
      include: {
        workflows: true,
      },
    });

    let webhookUrl: string | undefined;
    if (integration.type === 'WEBHOOK') {
      const result = await webhookConnector.registerWebhook(integration.id, data.baseUrl);
      webhookUrl = result.webhookUrl;
      
      // Update integration config to include the full webhookUrl
      const updated = await prisma.integration.update({
        where: { id: integration.id },
        data: {
          config: {
            ...((integration.config as any) || {}),
            webhookUrl: result.webhookUrl,
          } as any,
        },
      });
      
      return {
        ...this.mapIntegration(updated),
        webhookUrl,
      };
    }

    return {
      ...this.mapIntegration(integration),
      webhookUrl,
    };
  }

  // Create workflow
  async createWorkflow(
    integrationId: string,
    workflow: {
      name: string;
      triggerConfig: ITriggerConfig;
      actionConfig: IActionConfig;
      isActive?: boolean;
    }
  ): Promise<IIntegrationWorkflow> {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new NotFoundError('Integration');
    }

    const created = await prisma.integrationWorkflow.create({
      data: {
        name: workflow.name,
        integrationId,
        triggerConfig: workflow.triggerConfig as any,
        actionConfig: workflow.actionConfig as any,
        isActive: workflow.isActive ?? true,
      },
    });

    return this.mapWorkflow(created);
  }

  // Execute workflow (stub)
  async executeWorkflow(workflowId: string, triggerData: any): Promise<void> {
    const workflow = await prisma.integrationWorkflow.findUnique({
      where: { id: workflowId },
      include: {
        integration: true,
      },
    });

    if (!workflow) {
      throw new NotFoundError('IntegrationWorkflow');
    }

    // Here we would inspect workflow.actionConfig.action and dispatch accordingly:
    // - create_task
    // - send_email
    // - call_webhook
    //
    // For now, we only increment executionCount and log.
    await prisma.integrationWorkflow.update({
      where: { id: workflowId },
      data: {
        executionCount: { increment: 1 },
        lastExecutedAt: new Date(),
      },
    });

    // eslint-disable-next-line no-console
    console.log('[IntegrationService] executeWorkflow stub', {
      workflowId,
      integrationId: workflow.integrationId,
      triggerData,
    });
  }

  // Get single integration
  async getIntegration(id: string): Promise<IIntegration | null> {
    const integration = await prisma.integration.findUnique({
      where: { id },
      include: { workflows: true },
    });

    if (!integration) {
      return null;
    }

    return this.mapIntegration(integration, integration.workflows);
  }

  // List integrations for a company
  async listIntegrations(companyId: string): Promise<IIntegration[]> {
    const integrations = await prisma.integration.findMany({
      where: { companyId },
      include: { workflows: true },
      orderBy: { createdAt: 'desc' },
    });

    return integrations.map((i) => this.mapIntegration(i, i.workflows));
  }

  // Delete integration
  async deleteIntegration(id: string): Promise<void> {
    const integration = await prisma.integration.findUnique({
      where: { id },
      include: { workflows: true },
    });

    if (!integration) {
      throw new NotFoundError('Integration');
    }

    // Delete all workflows first (cascade)
    if (integration.workflows.length > 0) {
      await prisma.integrationWorkflow.deleteMany({
        where: { integrationId: id },
      });
    }

    // Delete the integration
    await prisma.integration.delete({
      where: { id },
    });
  }

  // Test workflow
  async testWorkflow(
    integrationId: string,
    workflowId: string,
    testData: Record<string, unknown>
  ): Promise<{ success: boolean; result: unknown }> {
    const workflow = await prisma.integrationWorkflow.findUnique({
      where: { id: workflowId },
      include: { integration: true },
    });

    if (!workflow) {
      throw new NotFoundError('IntegrationWorkflow');
    }

    if (workflow.integrationId !== integrationId) {
      throw new ValidationError('Workflow does not belong to this integration', {
        workflowId,
        integrationId,
      });
    }

    // Simulate workflow execution with test data
    // Check if trigger filters match
    const triggerConfig = (workflow.triggerConfig as any) || {};
    const filters = (triggerConfig.filters as Record<string, unknown>) || {};
    
    const matches = Object.entries(filters).every(([key, value]) => {
      return testData[key] === value;
    });

    if (!matches) {
      return {
        success: false,
        result: { message: 'Trigger filters did not match test data' },
      };
    }

    // For now, just return success
    // In a real implementation, this would execute the action
    return {
      success: true,
      result: {
        message: 'Workflow would execute successfully',
        action: workflow.actionConfig,
        testData,
      },
    };
  }
}

export const integrationService = new IntegrationService();


