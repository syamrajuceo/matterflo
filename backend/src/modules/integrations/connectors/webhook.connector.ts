import { prisma } from '../../../common/config/database.config';
import { NotFoundError } from '../../../common/errors';
import type { IIntegration, IIntegrationWorkflow } from '../integration.types';

/**
 * Simple webhook connector.
 *
 * Generates a unique webhook ID and stores it in the integration config.
 * Incoming webhooks are routed via /api/integrations/webhooks/:webhookId.
 */
export class WebhookConnector {
  // Register webhook endpoint for an integration
  async registerWebhook(integrationId: string, baseUrl: string): Promise<{ webhookUrl: string }> {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new NotFoundError('Integration');
    }

    const currentConfig = (integration.config as any) || {};

    // Reuse existing webhookId if present, otherwise generate one
    const webhookId =
      currentConfig.webhookId ||
      `${integrationId}-${Math.random().toString(36).substring(2, 10)}-${Date.now().toString(36)}`;

    const updated = await prisma.integration.update({
      where: { id: integrationId },
      data: {
        config: {
          ...(currentConfig || {}),
          webhookId,
        } as any,
      },
    });

    const url = `${baseUrl.replace(/\/$/, '')}/api/integrations/webhooks/${webhookId}`;

    return { webhookUrl: url };
  }

  // Handle incoming webhook
  async handleWebhook(webhookId: string, payload: any): Promise<void> {
    // Find integration with this webhookId in config
    const integration = await prisma.integration.findFirst({
      where: {
        config: {
          path: ['webhookId'],
          equals: webhookId,
        } as any,
      },
    });

    if (!integration) {
      throw new NotFoundError('Integration');
    }

    // Find active workflows for this integration that listen to webhook_received
    const workflows = await prisma.integrationWorkflow.findMany({
      where: {
        integrationId: integration.id,
        isActive: true,
      },
    });

    // For now, we just log the event and increment executionCount
    for (const workflow of workflows) {
      // Basic filter match: if triggerConfig.filters are present, require all keys to match payload
      const triggerConfig = (workflow.triggerConfig as any) || {};
      if (triggerConfig.event && triggerConfig.event !== 'webhook_received') {
        continue;
      }

      const filters = (triggerConfig.filters as Record<string, any>) || {};
      const matches = Object.entries(filters).every(([key, value]) => payload?.[key] === value);
      if (!matches) continue;

      // Increment executionCount and update lastExecutedAt
      await prisma.integrationWorkflow.update({
        where: { id: workflow.id },
        data: {
          executionCount: { increment: 1 },
          lastExecutedAt: new Date(),
        },
      });

      // Here we would dispatch to integrationService.executeWorkflow(workflow.id, payload)
      // To avoid circular deps, we just log for now.
      // eslint-disable-next-line no-console
      console.log('[WebhookConnector] Would execute workflow', workflow.id, 'with payload', payload);
    }
  }
}

export const webhookConnector = new WebhookConnector();


