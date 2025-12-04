import { prisma } from '../../common/config/database.config';
import { NotFoundError, ValidationError } from '../../common/errors';
import type {
  ITrigger,
  ICreateTriggerRequest,
  IUpdateTriggerRequest,
  IListTriggersFilters,
  IListTriggersResponse,
  ITestTriggerRequest,
  ITestTriggerResponse,
} from './trigger.types';
import { TriggerEvaluator } from './trigger.evaluator';

class TriggerService {
  /**
   * Map Prisma Trigger to ITrigger
   */
  private mapTriggerToITrigger(trigger: any): ITrigger {
    return {
      id: trigger.id,
      name: trigger.name,
      description: trigger.description || undefined,
      isActive: trigger.isActive,
      eventType: trigger.eventType,
      eventConfig: (trigger.eventConfig as any) || {},
      conditions: trigger.conditions ? (trigger.conditions as any) : undefined,
      actions: (trigger.actions as any) || [],
      settings: (trigger.settings as any) || {},
      taskId: trigger.taskId || undefined,
      flowId: trigger.flowId || undefined,
      createdAt: trigger.createdAt,
      updatedAt: trigger.updatedAt,
    };
  }

  /**
   * Create a new trigger
   */
  async createTrigger(data: ICreateTriggerRequest): Promise<ITrigger> {
    try {
      // Validate that either taskId or flowId is provided, but not both
      if (data.taskId && data.flowId) {
        throw new ValidationError('Trigger cannot be attached to both task and flow', {});
      }

      // Verify task exists if provided
      if (data.taskId) {
        const task = await prisma.task.findUnique({
          where: { id: data.taskId },
        });
        if (!task) {
          throw new NotFoundError('Task');
        }
      }

      // Verify flow exists if provided
      if (data.flowId) {
        const flow = await prisma.flow.findUnique({
          where: { id: data.flowId },
        });
        if (!flow) {
          throw new NotFoundError('Flow');
        }
      }

      const trigger = await prisma.trigger.create({
        data: {
          name: data.name,
          description: data.description || null,
          isActive: data.isActive ?? true,
          eventType: data.eventType,
          eventConfig: (data.eventConfig || {}) as any,
          conditions: data.conditions ? (data.conditions as any) : null,
          actions: (data.actions || []) as any,
          settings: (data.settings || {}) as any,
          taskId: data.taskId || null,
          flowId: data.flowId || null,
        },
      });

      return this.mapTriggerToITrigger(trigger);
    } catch (error) {
      console.error('Error creating trigger:', error);
      throw error;
    }
  }

  /**
   * Get trigger by ID
   */
  async getTrigger(id: string): Promise<ITrigger | null> {
    try {
      const trigger = await prisma.trigger.findUnique({
        where: { id },
      });

      if (!trigger) {
        return null;
      }

      return this.mapTriggerToITrigger(trigger);
    } catch (error) {
      console.error('Error getting trigger:', error);
      throw error;
    }
  }

  /**
   * Update trigger
   */
  async updateTrigger(id: string, data: IUpdateTriggerRequest): Promise<ITrigger> {
    try {
      const existingTrigger = await prisma.trigger.findUnique({
        where: { id },
      });

      if (!existingTrigger) {
        throw new NotFoundError('Trigger');
      }

      // Validate task/flow if being updated
      if (data.taskId !== undefined || data.flowId !== undefined) {
        const taskId = data.taskId ?? existingTrigger.taskId;
        const flowId = data.flowId ?? existingTrigger.flowId;

        if (taskId && flowId) {
          throw new ValidationError('Trigger cannot be attached to both task and flow', {});
        }

        if (taskId) {
          const task = await prisma.task.findUnique({
            where: { id: taskId },
          });
          if (!task) {
            throw new NotFoundError('Task');
          }
        }

        if (flowId) {
          const flow = await prisma.flow.findUnique({
            where: { id: flowId },
          });
          if (!flow) {
            throw new NotFoundError('Flow');
          }
        }
      }

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.eventType !== undefined) updateData.eventType = data.eventType;
      if (data.eventConfig !== undefined) updateData.eventConfig = data.eventConfig as any;
      if (data.conditions !== undefined) updateData.conditions = data.conditions ? (data.conditions as any) : null;
      if (data.actions !== undefined) updateData.actions = data.actions as any;
      if (data.settings !== undefined) updateData.settings = data.settings as any;
      if (data.taskId !== undefined) updateData.taskId = data.taskId || null;
      if (data.flowId !== undefined) updateData.flowId = data.flowId || null;

      const trigger = await prisma.trigger.update({
        where: { id },
        data: updateData,
      });

      return this.mapTriggerToITrigger(trigger);
    } catch (error) {
      console.error('Error updating trigger:', error);
      throw error;
    }
  }

  /**
   * List triggers with filters
   */
  async listTriggers(filters: IListTriggersFilters): Promise<IListTriggersResponse> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (filters.taskId) {
        where.taskId = filters.taskId;
      }

      if (filters.flowId) {
        where.flowId = filters.flowId;
      }

      if (filters.eventType) {
        where.eventType = filters.eventType;
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      const [triggers, total] = await Promise.all([
        prisma.trigger.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.trigger.count({ where }),
      ]);

      return {
        triggers: triggers.map((t) => this.mapTriggerToITrigger(t)),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error listing triggers:', error);
      throw error;
    }
  }

  /**
   * Delete trigger
   */
  async deleteTrigger(id: string): Promise<void> {
    try {
      const trigger = await prisma.trigger.findUnique({
        where: { id },
      });

      if (!trigger) {
        throw new NotFoundError('Trigger');
      }

      await prisma.trigger.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting trigger:', error);
      throw error;
    }
  }

  /**
   * Test trigger with sample data
   */
  async testTrigger(id: string, sampleData: Record<string, any>): Promise<ITestTriggerResponse> {
    try {
      const trigger = await this.getTrigger(id);

      if (!trigger) {
        throw new NotFoundError('Trigger');
      }

      const startTime = Date.now();
      const evaluator = new TriggerEvaluator();
      const evaluation = evaluator.evaluate(trigger, sampleData);
      const evaluationTime = Date.now() - startTime;

      return {
        conditionsMet: evaluation.met,
        conditionResult: evaluation.result,
        actionsWouldExecute: evaluation.met ? trigger.actions : [],
        evaluationTime,
      };
    } catch (error) {
      console.error('Error testing trigger:', error);
      throw error;
    }
  }

  /**
   * Get trigger execution logs
   */
  async getTriggerExecutions(
    triggerId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    executions: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      // Verify trigger exists
      const trigger = await prisma.trigger.findUnique({
        where: { id: triggerId },
      });

      if (!trigger) {
        throw new NotFoundError('Trigger');
      }

      const skip = (page - 1) * limit;

      const [executions, total] = await Promise.all([
        prisma.triggerExecution.findMany({
          where: { triggerId },
          skip,
          take: limit,
          orderBy: { executedAt: 'desc' },
        }),
        prisma.triggerExecution.count({
          where: { triggerId },
        }),
      ]);

      return {
        executions: executions.map((exec) => ({
          id: exec.id,
          triggerId: exec.triggerId,
          eventData: exec.eventData,
          conditionsMet: exec.conditionsMet,
          conditionResult: exec.conditionResult,
          actionsExecuted: exec.actionsExecuted,
          status: exec.status,
          errorMessage: exec.errorMessage,
          executionTime: exec.executionTime,
          executedAt: exec.executedAt,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error getting trigger executions:', error);
      throw error;
    }
  }
}

export const triggerService = new TriggerService();

