import { EventType, TriggerExecutionStatus } from '@prisma/client';

// Condition types
export type ConditionOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'not_contains' | 'in' | 'not_in' | 'is_null' | 'is_not_null';

export interface ICondition {
  field: string;
  operator: ConditionOperator;
  value: any;
}

export interface IConditionGroup {
  operator: 'AND' | 'OR';
  conditions: (ICondition | IConditionGroup)[];
}

// Action types
export type ActionType = 'email' | 'flow' | 'database' | 'webhook' | 'task';

export interface IEmailAction {
  type: 'email';
  to: string | string[];
  subject: string;
  body: string;
  templateId?: string;
  variables?: Record<string, any>;
}

export interface IFlowAction {
  type: 'flow';
  flowId: string;
  contextData?: Record<string, any>;
}

export interface IDatabaseAction {
  type: 'database';
  tableId: string;
  operation: 'create' | 'update' | 'delete';
  data?: Record<string, any>;
  where?: Record<string, any>;
}

export interface IWebhookAction {
  type: 'webhook';
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

export interface ITaskAction {
  type: 'task';
  taskId: string;
  assignTo?: string; // User ID
  contextData?: Record<string, any>;
}

export type IAction = IEmailAction | IFlowAction | IDatabaseAction | IWebhookAction | ITaskAction;

// Trigger interfaces
export interface ITrigger {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  eventType: EventType;
  eventConfig: Record<string, any>;
  conditions?: IConditionGroup | ICondition;
  actions: IAction[];
  settings: {
    stopOnError?: boolean;
    timeout?: number; // milliseconds
    retryOnFailure?: boolean;
    maxRetries?: number;
  };
  taskId?: string;
  flowId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITriggerExecution {
  id: string;
  triggerId: string;
  eventData: Record<string, any>;
  conditionsMet: boolean;
  conditionResult: any;
  actionsExecuted: IActionExecutionResult[];
  status: TriggerExecutionStatus;
  errorMessage?: string;
  executionTime: number; // milliseconds
  executedAt: Date;
}

export interface IActionExecutionResult {
  action: IAction;
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
}

// Request/Response types
export interface ICreateTriggerRequest {
  name: string;
  description?: string;
  isActive?: boolean;
  eventType: EventType;
  eventConfig?: Record<string, any>;
  conditions?: IConditionGroup | ICondition;
  actions: IAction[];
  settings?: Partial<ITrigger['settings']>;
  taskId?: string;
  flowId?: string;
}

export interface IUpdateTriggerRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  eventType?: EventType;
  eventConfig?: Record<string, any>;
  conditions?: IConditionGroup | ICondition;
  actions?: IAction[];
  settings?: Partial<ITrigger['settings']>;
  taskId?: string | null;
  flowId?: string | null;
}

export interface IListTriggersFilters {
  taskId?: string;
  flowId?: string;
  eventType?: EventType;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface IListTriggersResponse {
  triggers: ITrigger[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ITestTriggerRequest {
  sampleData: Record<string, any>;
}

export interface ITestTriggerResponse {
  conditionsMet: boolean;
  conditionResult: any;
  actionsWouldExecute: IAction[];
  evaluationTime: number;
}

