import { useEffect, useState } from 'react';
import { useIntegrationsStore } from '../store/integrationsStore';
import { integrationsService } from '../services/integrations.service';
import { IntegrationCard } from './IntegrationCard';
import { ConnectModal } from './ConnectModal';
import { extractErrorMessage, extractErrorTitle } from '../utils/errorHandler';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Plus } from 'lucide-react';

const AVAILABLE_INTEGRATIONS = [
  { type: 'GMAIL', label: 'Gmail', icon: '📧' },
  { type: 'GOOGLE_SHEETS', label: 'Google Sheets', icon: '📊' },
  { type: 'WEBHOOK', label: 'Webhook', icon: '🪝' },
  { type: 'CUSTOM_API', label: 'Custom API', icon: '🔗' },
] as const;

export const IntegrationsList = () => {
  const {
    integrations,
    setIntegrations,
    setIsLoading,
    isLoading,
  } = useIntegrationsStore();
  const { showToast } = useToast();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedIntegrationType, setSelectedIntegrationType] = useState<string | null>(null);

  useEffect(() => {
    const loadIntegrations = async () => {
      try {
        setIsLoading(true);
        const fetched = await integrationsService.listIntegrations();
        setIntegrations(fetched);
      } catch (error) {
        console.error('Failed to load integrations', error);
        const errorMessage = extractErrorMessage(error);
        const errorTitle = extractErrorTitle(error, 'Failed to load integrations');
        showToast({
          title: errorTitle,
          description: errorMessage || 'Please try again after reloading the page.',
          status: 'error',
          duration: 7000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    void loadIntegrations();
  }, [setIntegrations, setIsLoading, showToast]);

  const handleConnect = (type: string) => {
    setSelectedIntegrationType(type);
    setIsConnectModalOpen(true);
  };

  const handleConnectSuccess = () => {
    setIsConnectModalOpen(false);
    setSelectedIntegrationType(null);
    // Reload integrations
    void integrationsService.listIntegrations().then(setIntegrations);
  };

  const connectedIntegrations = integrations.filter((int) => int.isActive);
  const availableTypes = AVAILABLE_INTEGRATIONS.map((int) => int.type);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">Integrations</h1>
        <Button size="sm" variant="outline" onClick={() => setIsConnectModalOpen(true)}>
          <Plus className="mr-1 h-3 w-3" />
          Add Integration
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-6 p-4">
          {/* Available Integrations */}
          <div>
            <h2 className="mb-3 text-xs font-medium text-muted-foreground">
              Available Integrations
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {AVAILABLE_INTEGRATIONS.map((integration) => (
                <Card
                  key={integration.type}
                  className="flex cursor-pointer flex-col items-center justify-center border p-4 text-center transition hover:bg-muted/40"
                  onClick={() => handleConnect(integration.type)}
                >
                  <div className="mb-2 text-2xl">{integration.icon}</div>
                  <div className="mb-2 text-xs font-medium text-foreground">
                    {integration.label}
                  </div>
                  <Button size="xs" variant="outline" className="h-6 text-[10px]">
                    Connect
                  </Button>
                </Card>
              ))}
            </div>
          </div>

          {/* Connected Integrations */}
          <div>
            <h2 className="mb-3 text-xs font-medium text-muted-foreground">
              Connected Integrations
            </h2>
            {connectedIntegrations.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
                No integrations connected yet. Click on an integration above to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {connectedIntegrations.map((integration) => (
                  <IntegrationCard key={integration.id} integration={integration} />
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      <ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => {
          setIsConnectModalOpen(false);
          setSelectedIntegrationType(null);
        }}
        integrationType={selectedIntegrationType}
        onSuccess={handleConnectSuccess}
      />
    </div>
  );
};

