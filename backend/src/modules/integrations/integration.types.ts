export interface IIntegration {
  id: string;
  name: string;
  type: 'GMAIL' | 'GOOGLE_SHEETS' | 'OUTLOOK' | 'WEBHOOK' | 'CUSTOM_API';
  isActive: boolean;
  config: any; // Type-specific config (API keys, webhook info, etc.)
  companyId: string;
  workflows: IIntegrationWorkflow[];
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
}

export interface IIntegrationWorkflow {
  id: string;
  name: string;
  triggerConfig: ITriggerConfig; // When to trigger
  actionConfig: IActionConfig; // What to do
  isActive: boolean;
}

export interface ITriggerConfig {
  event: string; // e.g. "webhook_received", "email_received"
  filters?: Record<string, any>;
}

export interface IActionConfig {
  action: string; // e.g. "create_task", "send_email", "call_webhook"
  params?: Record<string, any>;
}


