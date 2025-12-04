/**
 * Action Builder Types
 * 
 * These types match the backend structure for actions
 */

export type ActionType = 'email' | 'flow' | 'database' | 'webhook' | 'task';

export type SendToType = 'role' | 'user' | 'email' | 'dynamic';

export interface IEmailAction {
  type: 'email';
  to: string | string[]; // Role ID, User ID, or email address
  sendToType: SendToType;
  subject: string;
  body: string;
  templateId?: string;
  variables?: Record<string, any>;
  includeTaskDetails?: boolean;
  attachFiles?: boolean;
}

export interface IFlowAction {
  type: 'flow';
  flowId: string;
  assignTo?: string; // User ID or Role ID
  contextData?: Record<string, any>;
  passData: 'all' | 'specific';
  specificFields?: string[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface IDatabaseAction {
  type: 'database';
  tableId: string;
  operation: 'create' | 'update' | 'delete';
  data?: Record<string, any>;
  where?: any; // Condition structure
}

export interface IWebhookAction {
  type: 'webhook';
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  auth?: {
    type: 'none' | 'bearer' | 'api_key';
    token?: string;
    apiKey?: string;
    apiKeyHeader?: string;
  };
}

export interface ITaskAction {
  type: 'task';
  taskId: string;
  assignTo?: string; // User ID or Role ID
  dueDate?: string | { type: 'relative'; value: number; unit: 'days' | 'weeks' | 'months' };
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  contextData?: Record<string, any>;
}

export type IAction = IEmailAction | IFlowAction | IDatabaseAction | IWebhookAction | ITaskAction;

// Action type labels
export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  email: 'Send Email',
  flow: 'Start Flow',
  database: 'Update Database',
  webhook: 'Call Webhook',
  task: 'Assign Task',
};

// Action type icons (using emoji for now, can be replaced with Lucide icons)
export const ACTION_TYPE_ICONS: Record<ActionType, string> = {
  email: '✉️',
  flow: '🔄',
  database: '💾',
  webhook: '🔗',
  task: '📋',
};

