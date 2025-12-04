import { useState, useEffect } from 'react';
import { useIntegrationsStore } from '../../store/integrationsStore';
import { integrationsService } from '../../services/integrations.service';
import { extractErrorMessage, extractErrorTitle } from '../../utils/errorHandler';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ExternalLink } from 'lucide-react';

interface GmailConnectorProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const GmailConnector = ({ onSuccess, onCancel }: GmailConnectorProps) => {
  const { addIntegration, setIsLoading } = useIntegrationsStore();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Check if we're returning from OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      showToast({
        title: 'Connection failed',
        description: 'Failed to connect Gmail. Please try again.',
        status: 'error',
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (code) {
      handleCallback(code);
    }
  }, [showToast]);

  const handleCallback = async (code: string) => {
    try {
      setIsLoading(true);
      const integration = await integrationsService.handleGmailCallback(code);
      addIntegration(integration);
      showToast({
        title: 'Gmail connected',
        description: 'Your Gmail account has been connected successfully.',
        status: 'success',
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      onSuccess();
    } catch (error) {
      console.error('Failed to handle Gmail callback', error);
      const errorMessage = extractErrorMessage(error);
      const errorTitle = extractErrorTitle(error, 'Connection failed');
      showToast({
        title: errorTitle,
        description: errorMessage || 'Failed to complete Gmail connection. Please try again.',
        status: 'error',
        duration: 7000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!name.trim()) {
      showToast({
        title: 'Validation error',
        description: 'Please enter a name for this Gmail integration.',
        status: 'error',
      });
      return;
    }

    try {
      setIsConnecting(true);
      // Create integration first, then redirect to OAuth
      const integration = await integrationsService.createIntegration({
        name: name.trim(),
        type: 'GMAIL',
        config: {},
      });
      addIntegration(integration);

      // Redirect to OAuth flow
      await integrationsService.connectGmail();
    } catch (error) {
      console.error('Failed to connect Gmail', error);
      const errorMessage = extractErrorMessage(error);
      const errorTitle = extractErrorTitle(error, 'Failed to connect Gmail');
      showToast({
        title: errorTitle,
        description: errorMessage,
        status: 'error',
        duration: 7000,
      });
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label className="text-[11px]">Integration Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Gmail - john@company.com"
        />
      </div>

      <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
        <p className="mb-2 font-medium text-foreground">How it works:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Connect your Gmail account using OAuth</li>
          <li>Create workflows to process incoming emails</li>
          <li>Automatically trigger actions based on email events</li>
        </ul>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isConnecting}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleConnect}
          disabled={!name.trim() || isConnecting}
        >
          {isConnecting ? (
            'Connecting...'
          ) : (
            <>
              <ExternalLink className="mr-1 h-3 w-3" />
              Connect with Google
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

