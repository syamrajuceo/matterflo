import { useState } from 'react';
import { useIntegrationsStore } from '../../store/integrationsStore';
import { integrationsService } from '../../services/integrations.service';
import { extractErrorMessage, extractErrorTitle } from '../../utils/errorHandler';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

interface GenericConnectorProps {
  type: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const GenericConnector = ({ type, onSuccess, onCancel }: GenericConnectorProps) => {
  const { addIntegration, setIsLoading } = useIntegrationsStore();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [configJson, setConfigJson] = useState('{}');

  const handleCreate = async () => {
    if (!name.trim()) {
      showToast({
        title: 'Validation error',
        description: 'Please enter a name for this integration.',
        status: 'error',
      });
      return;
    }

    let config: Record<string, unknown> = {};
    try {
      if (configJson.trim()) {
        config = JSON.parse(configJson);
      }
    } catch (error) {
      showToast({
        title: 'Invalid JSON',
        description: 'Please enter valid JSON in the config field.',
        status: 'error',
      });
      return;
    }

    if (apiKey.trim()) {
      config.apiKey = apiKey.trim();
    }
    if (apiUrl.trim()) {
      config.apiUrl = apiUrl.trim();
    }

    try {
      setIsLoading(true);
      const integration = await integrationsService.createIntegration({
        name: name.trim(),
        type: type as any,
        config,
      });
      addIntegration(integration);
      showToast({
        title: 'Integration created',
        description: 'Your integration has been created successfully.',
        status: 'success',
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to create integration', error);
      const errorMessage = extractErrorMessage(error);
      const errorTitle = extractErrorTitle(error, 'Failed to create integration');
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

  const typeLabel = type.replace('_', ' ');

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label className="text-[11px]">Integration Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`${typeLabel} Integration`}
        />
      </div>

      {type === 'CUSTOM_API' && (
        <>
          <div className="space-y-1">
            <Label className="text-[11px]">API URL (optional)</Label>
            <Input
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.example.com"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px]">API Key (optional)</Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
            />
          </div>
        </>
      )}

      <div className="space-y-1">
        <Label className="text-[11px]">Additional Config (JSON)</Label>
        <Textarea
          value={configJson}
          onChange={(e) => setConfigJson(e.target.value)}
          placeholder='{"key": "value"}'
          className="h-24 font-mono text-xs"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={handleCreate} disabled={!name.trim()}>
          Create Integration
        </Button>
      </div>
    </div>
  );
};

