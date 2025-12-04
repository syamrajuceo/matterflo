import { prisma } from '../../../common/config/database.config';
import { NotFoundError, ValidationError } from '../../../common/errors';
import type { IIntegration } from '../integration.types';

/**
 * Gmail connector stub.
 *
 * NOTE: This is a framework stub – it does not perform real OAuth or Gmail API calls.
 * It focuses on:
 * - Storing config/tokens securely (in the integration.config JSON)
 * - Defining the integration contract
 */
export class GmailConnector {
  // Connect Gmail (OAuth)
  async connect(authCode: string, companyId: string): Promise<IIntegration> {
    if (!authCode) {
      throw new ValidationError('authCode is required', { authCode });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundError('Company');
    }

    // In a real implementation, we would:
    // - Exchange authCode for access/refresh tokens via Google OAuth
    // - Encrypt tokens before storing
    // Here we just store a placeholder token for structure.
    const integration = await prisma.integration.create({
      data: {
        name: 'Gmail Integration',
        type: 'GMAIL',
        isActive: true,
        companyId,
        config: {
          provider: 'gmail',
          authCode,
          // token: 'encrypted-token-here'
        } as any,
      },
      include: {
        workflows: true,
      },
    });

    return {
      id: integration.id,
      name: integration.name,
      type: integration.type as any,
      isActive: integration.isActive,
      config: integration.config as any,
      companyId: integration.companyId,
      workflows: integration.workflows as any,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
      lastSyncAt: integration.lastSyncAt ?? undefined,
    };
  }

  // Watch for emails
  async watchEmails(
    integrationId: string,
    filters: { subject?: string; from?: string; hasAttachment?: boolean }
  ): Promise<void> {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new NotFoundError('Integration');
    }

    // In a real implementation:
    // - Configure Gmail push notifications with the given filters
    // For now, just store filters in config and log.
    const currentConfig = (integration.config as any) || {};
    await prisma.integration.update({
      where: { id: integrationId },
      data: {
        config: {
          ...(currentConfig || {}),
          watchFilters: filters,
        } as any,
      },
    });

    // eslint-disable-next-line no-console
    console.log('[GmailConnector] watchEmails configured for integration', integrationId, filters);
  }

  // Send email
  async sendEmail(
    integrationId: string,
    data: { to: string; subject: string; body: string; attachments?: any[] }
  ): Promise<void> {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new NotFoundError('Integration');
    }

    if (!data.to || !data.subject || !data.body) {
      throw new ValidationError('Missing email fields', { to: data.to, subject: data.subject });
    }

    // Real implementation would:
    // - Decrypt tokens from integration.config
    // - Use Gmail API to send the message
    // For now, just log the payload.
    // eslint-disable-next-line no-console
    console.log('[GmailConnector] Would send email via Gmail API', {
      integrationId,
      to: data.to,
      subject: data.subject,
    });
  }
}

export const gmailConnector = new GmailConnector();


