export type EventType =
  | 'TASK_COMPLETED'
  | 'TASK_STARTED'
  | 'TASK_UPDATED'
  | 'FIELD_CHANGED'
  | 'FLOW_STARTED'
  | 'FLOW_COMPLETED'
  | 'DATABASE_ROW_CREATED'
  | 'DATABASE_ROW_UPDATED'
  | 'SCHEDULED'
  | 'WEBHOOK_RECEIVED';

export type TriggerExecutionStatus = 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED';

export interface ITriggerAction {
  type: string;
  config: any;
}

export interface ITriggerCondition {
  field?: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: any;
  logic?: 'AND' | 'OR';
}

export interface ITrigger {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  eventType: EventType;
  eventConfig: any;
  conditions?: ITriggerCondition[];
  actions: ITriggerAction[];
  settings: any;
  taskId?: string;
  flowId?: string;
  levelId?: string; // Stored in eventConfig for level-specific triggers
  createdAt: string;
  updatedAt: string;
}

export interface ITriggerExecution {
  id: string;
  triggerId: string;
  eventData: any;
  conditionsMet: boolean;
  conditionResult: any;
  actionsExecuted: ITriggerAction[];
  status: TriggerExecutionStatus;
  errorMessage?: string;
  executionTime: number;
  executedAt: string;
}

export interface ICreateTriggerRequest {
  name: string;
  description?: string;
  eventType: EventType;
  eventConfig?: any;
  conditions?: ITriggerCondition[];
  actions: ITriggerAction[];
  settings?: any;
  taskId?: string;
  flowId?: string;
  levelId?: string;
}

export interface IUpdateTriggerRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  eventType?: EventType;
  eventConfig?: any;
  conditions?: ITriggerCondition[];
  actions?: ITriggerAction[];
  settings?: any;
}

export interface IListTriggersParams {
  flowId?: string;
  levelId?: string;
  taskId?: string;
  isActive?: boolean;
}

