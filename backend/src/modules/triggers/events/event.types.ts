import { EventType } from '@prisma/client';

// Re-export EventType for convenience
export type { EventType };

/**
 * Base event interface
 */
export interface IEvent {
  id: string;
  type: EventType;
  timestamp: Date;
  sourceId?: string; // taskId, flowId, tableId, etc.
  data: Record<string, any>;
  metadata?: {
    userId?: string;
    companyId?: string;
    [key: string]: any;
  };
}

/**
 * Task-related events
 */
export interface ITaskCompletedEvent extends IEvent {
  type: 'TASK_COMPLETED';
  sourceId: string; // taskId
  data: {
    taskId: string;
    taskExecutionId: string;
    executorId: string;
    submittedData: Record<string, any>;
    [key: string]: any;
  };
}

export interface ITaskStartedEvent extends IEvent {
  type: 'TASK_STARTED';
  sourceId: string; // taskId
  data: {
    taskId: string;
    taskExecutionId: string;
    executorId: string;
    [key: string]: any;
  };
}

export interface ITaskUpdatedEvent extends IEvent {
  type: 'TASK_UPDATED';
  sourceId: string; // taskId
  data: {
    taskId: string;
    changes: Record<string, any>;
    [key: string]: any;
  };
}

export interface IFieldChangedEvent extends IEvent {
  type: 'FIELD_CHANGED';
  sourceId: string; // taskId
  data: {
    taskId: string;
    fieldId: string;
    fieldName: string;
    oldValue: any;
    newValue: any;
    [key: string]: any;
  };
}

/**
 * Flow-related events
 */
export interface IFlowStartedEvent extends IEvent {
  type: 'FLOW_STARTED';
  sourceId: string; // flowId
  data: {
    flowId: string;
    flowInstanceId: string;
    initiatorId: string;
    contextData: Record<string, any>;
    [key: string]: any;
  };
}

export interface IFlowCompletedEvent extends IEvent {
  type: 'FLOW_COMPLETED';
  sourceId: string; // flowId
  data: {
    flowId: string;
    flowInstanceId: string;
    initiatorId: string;
    completedAt: Date;
    [key: string]: any;
  };
}

/**
 * Database-related events
 */
export interface IDatabaseRowCreatedEvent extends IEvent {
  type: 'DATABASE_ROW_CREATED';
  sourceId: string; // tableId
  data: {
    tableId: string;
    rowId: string;
    rowData: Record<string, any>;
    [key: string]: any;
  };
}

export interface IDatabaseRowUpdatedEvent extends IEvent {
  type: 'DATABASE_ROW_UPDATED';
  sourceId: string; // tableId
  data: {
    tableId: string;
    rowId: string;
    oldData: Record<string, any>;
    newData: Record<string, any>;
    [key: string]: any;
  };
}

/**
 * Scheduled events
 */
export interface IScheduledEvent extends IEvent {
  type: 'SCHEDULED';
  sourceId?: string;
  data: {
    scheduleId: string;
    scheduledAt: Date;
    [key: string]: any;
  };
}

/**
 * Webhook events
 */
export interface IWebhookReceivedEvent extends IEvent {
  type: 'WEBHOOK_RECEIVED';
  sourceId?: string;
  data: {
    webhookId: string;
    payload: Record<string, any>;
    headers: Record<string, string>;
    [key: string]: any;
  };
}

/**
 * Union type for all events
 */
export type Event =
  | ITaskCompletedEvent
  | ITaskStartedEvent
  | ITaskUpdatedEvent
  | IFieldChangedEvent
  | IFlowStartedEvent
  | IFlowCompletedEvent
  | IDatabaseRowCreatedEvent
  | IDatabaseRowUpdatedEvent
  | IScheduledEvent
  | IWebhookReceivedEvent;

/**
 * Event channel names
 */
export const EVENT_CHANNELS = {
  TRIGGERS: 'triggers:events',
  TASKS: 'tasks:events',
  FLOWS: 'flows:events',
  DATABASE: 'database:events',
  SCHEDULED: 'scheduled:events',
  WEBHOOKS: 'webhooks:events',
} as const;

/**
 * Consumer group name
 */
export const CONSUMER_GROUP = 'trigger-consumers';

