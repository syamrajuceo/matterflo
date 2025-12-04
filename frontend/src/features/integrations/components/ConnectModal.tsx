import { useState } from 'react';
import { useIntegrationsStore } from '../store/integrationsStore';
import { integrationsService } from '../services/integrations.service';
import { WebhookConnector } from './connectors/WebhookConnector';
import { GmailConnector } from './connectors/GmailConnector';
import { GenericConnector } from './connectors/GenericConnector';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  integrationType: string | null;
  onSuccess?: () => void;
}

export const ConnectModal = ({
  isOpen,
  onClose,
  integrationType,
  onSuccess,
}: ConnectModalProps) => {
  const { addIntegration, setIsLoading } = useIntegrationsStore();
  const { showToast } = useToast();

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  const renderConnector = () => {
    switch (integrationType) {
      case 'WEBHOOK':
        return <WebhookConnector onSuccess={handleSuccess} onCancel={onClose} />;
      case 'GMAIL':
        return <GmailConnector onSuccess={handleSuccess} onCancel={onClose} />;
      case 'GOOGLE_SHEETS':
      case 'CUSTOM_API':
      case 'OUTLOOK':
        return (
          <GenericConnector
            type={integrationType}
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        );
      default:
        return (
          <div className="py-4 text-center text-xs text-muted-foreground">
            Select an integration type to connect
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {integrationType ? `Connect ${integrationType.replace('_', ' ')}` : 'Add Integration'}
          </DialogTitle>
          <DialogDescription className="text-[11px] text-muted-foreground">
            {integrationType
              ? `Configure and connect your ${integrationType.replace('_', ' ').toLowerCase()} integration.`
              : 'Select an integration type to get started.'}
          </DialogDescription>
        </DialogHeader>
        {renderConnector()}
      </DialogContent>
    </Dialog>
  );
};

