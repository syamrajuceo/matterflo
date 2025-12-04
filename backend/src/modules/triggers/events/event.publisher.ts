import { EventBus } from './event.bus';
import { EVENT_CHANNELS } from './event.types';
import type {
  ITaskCompletedEvent,
  ITaskStartedEvent,
  ITaskUpdatedEvent,
  IFieldChangedEvent,
  IFlowStartedEvent,
  IFlowCompletedEvent,
  IDatabaseRowCreatedEvent,
  IDatabaseRowUpdatedEvent,
  IScheduledEvent,
  IWebhookReceivedEvent,
} from './event.types';

/**
 * Event Publisher - Convenience functions for publishing events
 */
class EventPublisher {
  private eventBus: EventBus | null = null;

  private async getEventBus(): Promise<EventBus> {
    if (!this.eventBus) {
      this.eventBus = await EventBus.getInstance();
    }
    return this.eventBus;
  }

  /**
   * Publish task completed event
   */
  async publishTaskCompleted(
    taskId: string,
    data: ITaskCompletedEvent['data']
  ): Promise<string> {
    const bus = await this.getEventBus();
    return bus.publish(EVENT_CHANNELS.TRIGGERS, 'TASK_COMPLETED', {
      sourceId: taskId,
      ...data,
    });
  }

  /**
   * Publish task started event
   */
  async publishTaskStarted(taskId: string, data: ITaskStartedEvent['data']): Promise<string> {
    const bus = await this.getEventBus();
    return bus.publish(EVENT_CHANNELS.TRIGGERS, 'TASK_STARTED', {
      sourceId: taskId,
      ...data,
    });
  }

  /**
   * Publish task updated event
   */
  async publishTaskUpdated(taskId: string, data: ITaskUpdatedEvent['data']): Promise<string> {
    const bus = await this.getEventBus();
    return bus.publish(EVENT_CHANNELS.TRIGGERS, 'TASK_UPDATED', {
      sourceId: taskId,
      ...data,
    });
  }

  /**
   * Publish field changed event
   */
  async publishFieldChanged(
    taskId: string,
    fieldId: string,
    fieldName: string,
    oldValue: any,
    newValue: any,
    additionalData?: Record<string, any>
  ): Promise<string> {
    const bus = await this.getEventBus();
    return bus.publish(EVENT_CHANNELS.TRIGGERS, 'FIELD_CHANGED', {
      sourceId: taskId,
      taskId,
      fieldId,
      fieldName,
      oldValue,
      newValue,
      ...additionalData,
    });
  }

  /**
   * Publish flow started event
   */
  async publishFlowStarted(flowId: string, data: IFlowStartedEvent['data']): Promise<string> {
    const bus = await this.getEventBus();
    return bus.publish(EVENT_CHANNELS.TRIGGERS, 'FLOW_STARTED', {
      sourceId: flowId,
      ...data,
    });
  }

  /**
   * Publish flow completed event
   */
  async publishFlowCompleted(flowId: string, data: IFlowCompletedEvent['data']): Promise<string> {
    const bus = await this.getEventBus();
    return bus.publish(EVENT_CHANNELS.TRIGGERS, 'FLOW_COMPLETED', {
      sourceId: flowId,
      ...data,
    });
  }

  /**
   * Publish database row created event
   */
  async publishDatabaseRowCreated(
    tableId: string,
    rowId: string,
    rowData: Record<string, any>,
    additionalData?: Record<string, any>
  ): Promise<string> {
    const bus = await this.getEventBus();
    return bus.publish(EVENT_CHANNELS.TRIGGERS, 'DATABASE_ROW_CREATED', {
      sourceId: tableId,
      tableId,
      rowId,
      rowData,
      ...additionalData,
    });
  }

  /**
   * Publish database row updated event
   */
  async publishDatabaseRowUpdated(
    tableId: string,
    rowId: string,
    oldData: Record<string, any>,
    newData: Record<string, any>,
    additionalData?: Record<string, any>
  ): Promise<string> {
    const bus = await this.getEventBus();
    return bus.publish(EVENT_CHANNELS.TRIGGERS, 'DATABASE_ROW_UPDATED', {
      sourceId: tableId,
      tableId,
      rowId,
      oldData,
      newData,
      ...additionalData,
    });
  }

  /**
   * Publish scheduled event
   */
  async publishScheduled(data: IScheduledEvent['data']): Promise<string> {
    const bus = await this.getEventBus();
    return bus.publish(EVENT_CHANNELS.TRIGGERS, 'SCHEDULED', data);
  }

  /**
   * Publish webhook received event
   */
  async publishWebhookReceived(data: IWebhookReceivedEvent['data']): Promise<string> {
    const bus = await this.getEventBus();
    return bus.publish(EVENT_CHANNELS.TRIGGERS, 'WEBHOOK_RECEIVED', data);
  }
}

export const eventPublisher = new EventPublisher();

