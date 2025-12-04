import { useState } from 'react';
import type { IIntegration } from '../services/integrations.service';
import { useIntegrationsStore } from '../store/integrationsStore';
import { integrationsService } from '../services/integrations.service';
import { WorkflowEditor } from './WorkflowEditor';
import { extractErrorMessage, extractErrorTitle } from '../utils/errorHandler';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Settings, Trash2, ExternalLink, Copy, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import axios from 'axios';
// Helper function to format relative time
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
};

interface IntegrationCardProps {
  integration: IIntegration;
}

const INTEGRATION_ICONS: Record<string, string> = {
  GMAIL: '📧',
  GOOGLE_SHEETS: '📊',
  WEBHOOK: '🪝',
  CUSTOM_API: '🔗',
  OUTLOOK: '📧',
};

export const IntegrationCard = ({ integration }: IntegrationCardProps) => {
  const { removeIntegration, setSelectedIntegration, setIntegrations } = useIntegrationsStore();
  const { showToast } = useToast();
  const [isWorkflowEditorOpen, setIsWorkflowEditorOpen] = useState(false);
  const [isTestWebhookOpen, setIsTestWebhookOpen] = useState(false);

  const icon = INTEGRATION_ICONS[integration.type] || '🔗';
  const activeWorkflows = integration.workflows.filter((wf) => wf.isActive).length;

  const handleDelete = async () => {
    if (!window.confirm(`Delete integration "${integration.name}"? This cannot be undone.`)) {
      return;
    }
    try {
      await integrationsService.deleteIntegration(integration.id);
      removeIntegration(integration.id);
      // Reload integrations list to ensure UI is updated
      const updatedIntegrations = await integrationsService.listIntegrations();
      setIntegrations(updatedIntegrations);
      showToast({
        title: 'Integration deleted',
        description: `"${integration.name}" has been removed.`,
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to delete integration', error);
      const errorMessage = extractErrorMessage(error);
      const errorTitle = extractErrorTitle(error, 'Failed to delete integration');
      showToast({
        title: errorTitle,
        description: errorMessage,
        status: 'error',
        duration: 7000,
      });
    }
  };

  const getWebhookUrl = (): string | null => {
    if (integration.type !== 'WEBHOOK') return null;
    
    // Check if webhookUrl is in config
    if (integration.config?.webhookUrl) {
      const url = integration.config.webhookUrl as string;
      // If it's already a full URL, return it
      if (url.startsWith('http')) {
        return url;
      }
      // If it starts with /api, it's already a path - use base URL without /api
      if (url.startsWith('/api')) {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        // Remove /api from baseUrl if present
        const cleanBase = baseUrl.replace(/\/api$/, '');
        return `${cleanBase}${url}`;
      }
      // Otherwise, prepend base URL
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      return `${baseUrl}${url}`;
    }
    
    // Construct URL from webhookId if available
    if (integration.config?.webhookId) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      // Remove /api from baseUrl if present
      const cleanBase = baseUrl.replace(/\/api$/, '');
      return `${cleanBase}/api/integrations/webhooks/${integration.config.webhookId}`;
    }
    
    return null;
  };

  const handleCopyWebhookUrl = () => {
    const webhookUrl = getWebhookUrl();
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl);
      showToast({
        title: 'Webhook URL copied',
        description: 'The webhook URL has been copied to your clipboard.',
        status: 'success',
      });
    }
  };

  const getDisplayInfo = () => {
    switch (integration.type) {
      case 'GMAIL':
        return {
          subtitle: integration.config?.email as string | undefined || 'Connected',
          extraInfo: integration.lastSyncAt
            ? `Last sync: ${formatRelativeTime(integration.lastSyncAt)}`
            : undefined,
        };
      case 'WEBHOOK': {
        const webhookUrl = getWebhookUrl();
        return {
          subtitle: 'Webhook endpoint',
          extraInfo: webhookUrl
            ? `URL: ${webhookUrl.substring(0, 50)}...`
            : undefined,
        };
      }
      default:
        return {
          subtitle: integration.type.replace('_', ' '),
          extraInfo: undefined,
        };
    }
  };

  const info = getDisplayInfo();

  return (
    <>
      <Card className="border-l-4 border-l-primary px-3 py-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">{icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    {integration.name}
                  </span>
                  <Badge
                    variant={integration.isActive ? 'default' : 'secondary'}
                    className="h-4 px-1.5 text-[9px]"
                  >
                    {integration.isActive ? '● Active' : 'Inactive'}
                  </Badge>
                </div>
                {info.subtitle && (
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    {info.subtitle}
                  </div>
                )}
                {info.extraInfo && (
                  <div className="mt-1 text-[10px] text-muted-foreground">{info.extraInfo}</div>
                )}
                <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>{activeWorkflows} active workflow{activeWorkflows !== 1 ? 's' : ''}</span>
                  {integration.lastSyncAt && (
                    <span>Last triggered: {formatRelativeTime(integration.lastSyncAt)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-[11px]"
              onClick={() => {
                setSelectedIntegration(integration);
                setIsWorkflowEditorOpen(true);
              }}
              title="View Workflows"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
            {integration.type === 'WEBHOOK' && getWebhookUrl() && (
              <>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-[11px]"
                  onClick={() => setIsTestWebhookOpen(true)}
                  title="Test Webhook"
                >
                  <Send className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-[11px]"
                  onClick={handleCopyWebhookUrl}
                  title="Copy Webhook URL"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </>
            )}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-[11px]"
              title="Settings"
            >
              <Settings className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-[11px] text-destructive hover:text-destructive"
              onClick={handleDelete}
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </Card>

      {isWorkflowEditorOpen && (
        <WorkflowEditor
          integration={integration}
          isOpen={isWorkflowEditorOpen}
          onClose={() => setIsWorkflowEditorOpen(false)}
        />
      )}

      {isTestWebhookOpen && integration.type === 'WEBHOOK' && (
        <TestWebhookDialog
          integration={integration}
          isOpen={isTestWebhookOpen}
          onClose={() => setIsTestWebhookOpen(false)}
        />
      )}
    </>
  );
};

// Test Webhook Dialog Component
interface TestWebhookDialogProps {
  integration: IIntegration;
  isOpen: boolean;
  onClose: () => void;
}

const TestWebhookDialog = ({ integration, isOpen, onClose }: TestWebhookDialogProps) => {
  const { showToast } = useToast();
  const [testPayload, setTestPayload] = useState(
    JSON.stringify(
      {
        event_type: 'order.created',
        data: {
          order_id: '12345',
          customer: 'John Doe',
          amount: 99.99,
        },
      },
      null,
      2
    )
  );
  const [isSending, setIsSending] = useState(false);

  const getWebhookUrl = (): string | null => {
    if (integration.type !== 'WEBHOOK') return null;
    
    // Check if webhookUrl is in config
    if (integration.config?.webhookUrl) {
      const url = integration.config.webhookUrl as string;
      // If it's already a full URL, return it
      if (url.startsWith('http')) {
        return url;
      }
      // If it starts with /api, it's already a path - use baseURL from axios config
      if (url.startsWith('/api')) {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        // Remove /api from baseUrl if present, then append the path
        const cleanBase = baseUrl.replace(/\/api$/, '');
        return `${cleanBase}${url}`;
      }
      // Otherwise, prepend base URL
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      return `${baseUrl}${url}`;
    }
    
    // Construct URL from webhookId if available
    if (integration.config?.webhookId) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      // Ensure baseUrl doesn't have /api at the end
      const cleanBase = baseUrl.replace(/\/api$/, '');
      return `${cleanBase}/api/integrations/webhooks/${integration.config.webhookId}`;
    }
    
    return null;
  };

  const fullUrl = getWebhookUrl() || '';

  const handleSendTest = async () => {
    if (!fullUrl) {
      showToast({
        title: 'No webhook URL',
        description: 'Webhook URL is not available.',
        status: 'error',
      });
      return;
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(testPayload);
    } catch (error) {
      showToast({
        title: 'Invalid JSON',
        description: 'Please enter valid JSON payload.',
        status: 'error',
      });
      return;
    }

    try {
      setIsSending(true);
      // Send test webhook directly to the webhook endpoint
      await axios.post(fullUrl, payload);
      showToast({
        title: 'Test webhook sent',
        description: 'The test webhook has been sent successfully. Check workflows for execution.',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to send test webhook', error);
      const errorMessage = extractErrorMessage(error);
      const errorTitle = extractErrorTitle(error, 'Failed to send test webhook');
      showToast({
        title: errorTitle,
        description: errorMessage || 'Please check the webhook URL and try again.',
        status: 'error',
        duration: 7000,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-sm">Test Webhook</DialogTitle>
          <DialogDescription className="text-[11px] text-muted-foreground">
            Send a test payload to this webhook to verify it's working correctly.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-[11px]">Webhook URL</Label>
            <Input value={fullUrl} readOnly className="font-mono text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Test Payload (JSON)</Label>
            <Textarea
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              className="h-48 font-mono text-xs"
              placeholder='{"event_type": "order.created", "data": {...}}'
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleSendTest} disabled={isSending}>
              {isSending ? 'Sending...' : 'Send Test Webhook'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

