import { useState } from 'react';
import { useIntegrationsStore } from '../../store/integrationsStore';
import { integrationsService } from '../../services/integrations.service';
import { extractErrorMessage, extractErrorTitle } from '../../utils/errorHandler';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Copy, Check } from 'lucide-react';

interface WebhookConnectorProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const WebhookConnector = ({ onSuccess, onCancel }: WebhookConnectorProps) => {
  const { addIntegration, setIsLoading } = useIntegrationsStore();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      showToast({
        title: 'Validation error',
        description: 'Please enter a name for this webhook integration.',
        status: 'error',
      });
      return;
    }

    try {
      setIsLoading(true);
      const integration = await integrationsService.createIntegration({
        name: name.trim(),
        type: 'WEBHOOK',
        config: {},
      });

      // Get the full integration with webhook URL
      const fullIntegration = await integrationsService.getIntegration(integration.id);
      
      // Store webhookUrl in config if it's returned separately
      if ((fullIntegration as any).webhookUrl && !fullIntegration.config?.webhookUrl) {
        fullIntegration.config = {
          ...fullIntegration.config,
          webhookUrl: (fullIntegration as any).webhookUrl,
        };
      }
      
      addIntegration(fullIntegration);

      // Get webhook URL from config or construct it
      const url = fullIntegration.config?.webhookUrl 
        ? (fullIntegration.config.webhookUrl as string)
        : fullIntegration.config?.webhookId
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/integrations/webhooks/${fullIntegration.config.webhookId}`
        : '';
      
      if (url) {
        setWebhookUrl(url);
      }

      showToast({
        title: 'Webhook created',
        description: 'Your webhook integration has been created successfully.',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to create webhook', error);
      const errorMessage = extractErrorMessage(error);
      const errorTitle = extractErrorTitle(error, 'Failed to create webhook');
      showToast({
        title: errorTitle,
        description: errorMessage,
        status: 'error',
        duration: 7000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyUrl = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast({
        title: 'URL copied',
        description: 'The webhook URL has been copied to your clipboard.',
        status: 'success',
      });
    }
  };

  const examplePayload = {
    event_type: 'order.created',
    data: {
      order_id: '12345',
      customer: 'John Doe',
      amount: 99.99,
    },
  };

  return (
    <div className="space-y-4">
      {!webhookUrl ? (
        <>
          <div className="space-y-1">
            <Label className="text-[11px]">Integration Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Order Webhooks"
            />
          </div>

          <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
            <p className="mb-2 font-medium text-foreground">How it works:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Create a webhook integration to receive events from external systems</li>
              <li>You'll get a unique webhook URL to send POST requests to</li>
              <li>Configure workflows to process incoming webhook data</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleCreate}>
              Create Webhook
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-1">
            <Label className="text-[11px]">Webhook URL</Label>
            <div className="flex gap-2">
              <Input value={webhookUrl} readOnly className="font-mono text-xs" />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={handleCopyUrl}
                className="h-8 w-8"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Send POST requests to this URL to trigger workflows
            </p>
          </div>

          <Card className="border p-3">
            <div className="mb-2 text-xs font-medium text-foreground">Example Payload:</div>
            <Textarea
              readOnly
              value={JSON.stringify(examplePayload, null, 2)}
              className="h-32 font-mono text-[10px]"
            />
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" onClick={onSuccess}>
              Done
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

