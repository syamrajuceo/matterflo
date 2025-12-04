import { EventBus } from './event.bus';
import { EVENT_CHANNELS, CONSUMER_GROUP, EventType } from './event.types';
import { triggerService } from '../trigger.service';
import { TriggerEvaluator } from '../trigger.evaluator';
import { TriggerExecutor } from '../trigger.executor';
import { prisma } from '../../../common/config/database.config';
import type { ITrigger } from '../trigger.types';

/**
 * Trigger Event Consumer
 * Consumes events from Redis Streams and executes matching triggers
 */
export class TriggerEventConsumer {
  private eventBus: EventBus | null = null;
  private isRunning: boolean = false;
  private consumerName: string;
  private maxRetries: number = 3;
  private retryDelays: number[] = [1000, 5000, 30000]; // 1s, 5s, 30s

  constructor(consumerName: string = `consumer-${process.pid}-${Date.now()}`) {
    this.consumerName = consumerName;
  }

  /**
   * Start consuming events
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️  Consumer is already running');
      return;
    }

    this.isRunning = true;
    this.eventBus = await EventBus.getInstance();

    console.log(`🚀 Starting trigger event consumer: ${this.consumerName}`);

    // Start consuming events (this runs forever)
    this.consumeEvents().catch((error) => {
      console.error('❌ Consumer crashed:', error);
      this.isRunning = false;
      // Attempt to restart after delay
      setTimeout(() => {
        if (this.isRunning) {
          this.start();
        }
      }, 5000);
    });
  }

  /**
   * Stop consuming events
   */
  async stop(): Promise<void> {
    console.log(`🛑 Stopping trigger event consumer: ${this.consumerName}`);
    this.isRunning = false;
    
    // Close the event bus to stop the subscription loop
    if (this.eventBus) {
      await this.eventBus.close();
    }
    
    // Give a moment for the loop to exit
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Main event consumption loop
   */
  private async consumeEvents(): Promise<void> {
    if (!this.eventBus) {
      throw new Error('EventBus not initialized');
    }

    // Subscribe to events channel
    await this.eventBus.subscribe(
      EVENT_CHANNELS.TRIGGERS,
      async (messageId, eventType, data) => {
        await this.handleEvent(messageId, eventType as EventType, data);
      },
      this.consumerName
    );
  }

  /**
   * Handle a single event
   */
  private async handleEvent(
    messageId: string,
    eventType: EventType,
    eventData: Record<string, any>
  ): Promise<void> {
    const startTime = Date.now();

    try {
      console.log(`📥 Processing event: ${eventType} (Message ID: ${messageId})`);

      // Find relevant triggers
      const triggers = await this.findTriggersForEvent(eventType, eventData.sourceId);

      if (triggers.length === 0) {
        console.log(`ℹ️  No triggers found for event ${eventType}`);
        return;
      }

      console.log(`🔍 Found ${triggers.length} trigger(s) for event ${eventType}`);

      // Process each trigger
      for (const trigger of triggers) {
        await this.processTrigger(trigger, eventData, messageId);
      }
    } catch (error) {
      console.error(`❌ Error handling event ${messageId}:`, error);
      throw error;
    } finally {
      const executionTime = Date.now() - startTime;
      console.log(`⏱️  Event ${messageId} processed in ${executionTime}ms`);
    }
  }

  /**
   * Process a single trigger
   */
  private async processTrigger(
    trigger: ITrigger,
    eventData: Record<string, any>,
    messageId: string
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Evaluate conditions
      const evaluator = new TriggerEvaluator();
      const evaluation = evaluator.evaluate(trigger, eventData);

      if (!evaluation.met) {
        console.log(`⏭️  Trigger ${trigger.id} conditions not met, skipping`);
        return;
      }

      console.log(`✅ Trigger ${trigger.id} conditions met, executing actions...`);

      // Execute actions
      const executor = new TriggerExecutor();
      const actionResults = await executor.execute(trigger, eventData);

      // Determine overall status
      const allSuccess = actionResults.every((r) => r.success);
      const someSuccess = actionResults.some((r) => r.success);
      const status = allSuccess ? 'SUCCESS' : someSuccess ? 'PARTIAL_SUCCESS' : 'FAILED';

      // Calculate total execution time
      const executionTime = Date.now() - startTime;

      // Log execution to database
      await prisma.triggerExecution.create({
        data: {
          triggerId: trigger.id,
          eventData: eventData as any,
          conditionsMet: true,
          conditionResult: evaluation.result as any,
          actionsExecuted: actionResults as any,
          status,
          errorMessage: actionResults.find((r) => !r.success)?.error || null,
          executionTime,
        },
      });

      console.log(`✅ Trigger ${trigger.id} executed successfully (${status})`);
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error(`❌ Error executing trigger ${trigger.id}:`, error);

      // Log failed execution
      try {
        await prisma.triggerExecution.create({
          data: {
            triggerId: trigger.id,
            eventData: eventData as any,
            conditionsMet: false,
            conditionResult: { error: errorMessage } as any,
            actionsExecuted: [] as any,
            status: 'FAILED',
            errorMessage,
            executionTime,
          },
        });
      } catch (dbError) {
        console.error('❌ Failed to log execution to database:', dbError);
      }
    }
  }

  /**
   * Find triggers that match an event
   */
  private async findTriggersForEvent(
    eventType: EventType,
    sourceId?: string
  ): Promise<ITrigger[]> {
    try {
      const where: any = {
        isActive: true,
        eventType,
      };

      // If sourceId is provided, match triggers attached to that source
      if (sourceId) {
        where.OR = [
          { taskId: sourceId },
          { flowId: sourceId },
          // Also include triggers not attached to specific task/flow (global triggers)
          { taskId: null, flowId: null },
        ];
      } else {
        // Global triggers (not attached to specific task/flow)
        where.taskId = null;
        where.flowId = null;
      }

      const triggers = await prisma.trigger.findMany({
        where,
      });

      return triggers.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description || undefined,
        isActive: t.isActive,
        eventType: t.eventType,
        eventConfig: (t.eventConfig as any) || {},
        conditions: t.conditions ? (t.conditions as any) : undefined,
        actions: (t.actions as any) || [],
        settings: (t.settings as any) || {},
        taskId: t.taskId || undefined,
        flowId: t.flowId || undefined,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));
    } catch (error) {
      console.error('Error finding triggers:', error);
      return [];
    }
  }

  /**
   * Process pending messages (recovery)
   */
  async processPendingMessages(): Promise<void> {
    if (!this.eventBus) {
      this.eventBus = await EventBus.getInstance();
    }

    console.log('🔄 Processing pending messages...');

    const pending = await this.eventBus.getPendingMessages(
      EVENT_CHANNELS.TRIGGERS,
      this.consumerName
    );

    if (pending.length === 0) {
      console.log('✅ No pending messages');
      return;
    }

    console.log(`📋 Found ${pending.length} pending message(s)`);

    for (const msg of pending) {
      try {
        await this.handleEvent(msg.id, msg.eventType as EventType, msg.data);
      } catch (error) {
        console.error(`❌ Failed to process pending message ${msg.id}:`, error);
      }
    }
  }
}

