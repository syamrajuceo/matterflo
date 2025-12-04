import { prisma } from '../../common/config/database.config';
import { AppError } from '../../common/errors/AppError';
import type {
  ICreateTaskExecutionRequest,
  IUpdateTaskExecutionRequest,
  ITaskExecution,
  IFlowInstance,
  ICreateFlowInstanceRequest,
} from './execution.types';

class ExecutionService {
  /**
   * Create a new task execution (assign a task to a user)
   */
  async createTaskExecution(data: ICreateTaskExecutionRequest): Promise<ITaskExecution> {
    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: data.taskId },
    });

    if (!task) {
      throw new AppError(404, 'NOT_FOUND', 'Task not found');
    }

    // If part of a flow, verify flow instance exists
    if (data.flowInstanceId) {
      const flowInstance = await prisma.flowInstance.findUnique({
        where: { id: data.flowInstanceId },
      });

      if (!flowInstance) {
        throw new AppError(404, 'NOT_FOUND', 'Flow instance not found');
      }
    }

    const execution = await prisma.taskExecution.create({
      data: {
        taskId: data.taskId,
        executorId: data.executorId,
        flowInstanceId: data.flowInstanceId,
        levelId: data.levelId,
        status: 'PENDING',
        data: data.initialData || {},
      },
      include: {
        task: {
          select: {
            id: true,
            name: true,
            description: true,
            fields: true,
          },
        },
        executor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return this.mapToITaskExecution(execution);
  }

  /**
   * Get task execution by ID
   */
  async getTaskExecution(executionId: string, userId: string): Promise<ITaskExecution> {
    const execution = await prisma.taskExecution.findUnique({
      where: { id: executionId },
      include: {
        task: {
          select: {
            id: true,
            name: true,
            description: true,
            fields: true,
          },
        },
        executor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        flowInstance: {
          select: {
            id: true,
            currentLevelOrder: true,
          },
        },
      },
    });

    if (!execution) {
      throw new AppError(404, 'NOT_FOUND', 'Task execution not found');
    }

    // Check if user is the executor or has admin privileges
    if (execution.executorId !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
        throw new AppError(403, 'FORBIDDEN', 'Access denied');
      }
    }

    return this.mapToITaskExecution(execution);
  }

  /**
   * Update task execution (submit response)
   */
  async updateTaskExecution(
    executionId: string,
    userId: string,
    data: IUpdateTaskExecutionRequest
  ): Promise<ITaskExecution> {
    const existing = await prisma.taskExecution.findUnique({
      where: { id: executionId },
      include: {
        task: true,
        flowInstance: true,
      },
    });

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Task execution not found');
    }

    // Verify user is the executor
    if (existing.executorId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Access denied - not the assigned executor');
    }

    // Update execution
    const updated = await prisma.taskExecution.update({
      where: { id: executionId },
      data: {
        data: data.data,
        status: data.status || 'COMPLETED',
        completedAt: data.status === 'COMPLETED' ? new Date() : undefined,
      },
      include: {
        task: {
          select: {
            id: true,
            name: true,
            description: true,
            fields: true,
          },
        },
        executor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // If part of a flow, check if we should progress to next level
    if (existing.flowInstance && data.status === 'COMPLETED') {
      await this.progressFlowInstance(existing.flowInstance.id);
    }

    return this.mapToITaskExecution(updated);
  }

  /**
   * List task executions for a user (their pending tasks)
   */
  async listTaskExecutionsForUser(
    userId: string,
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  ): Promise<ITaskExecution[]> {
    const where: any = {
      executorId: userId,
    };

    if (status) {
      where.status = status;
    }

    const executions = await prisma.taskExecution.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            name: true,
            description: true,
            fields: true,
          },
        },
        executor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return executions.map((e) => this.mapToITaskExecution(e));
  }

  /**
   * Create a new flow instance (start a workflow)
   */
  async createFlowInstance(data: ICreateFlowInstanceRequest): Promise<IFlowInstance> {
    // Verify flow exists and is published
    const flow = await prisma.flow.findUnique({
      where: { id: data.flowId },
      include: {
        levels: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
              include: {
                task: true,
              },
            },
            roles: true,
          },
        },
      },
    });

    if (!flow) {
      throw new AppError(404, 'NOT_FOUND', 'Flow not found');
    }

    if (flow.status !== 'PUBLISHED' && flow.status !== 'ACTIVE') {
      throw new AppError(400, 'BAD_REQUEST', 'Flow is not published');
    }

    // Create flow instance
    const instance = await prisma.flowInstance.create({
      data: {
        flowId: data.flowId,
        initiatorId: data.initiatorId,
        currentLevelOrder: 1,
        status: 'IN_PROGRESS',
        contextData: data.contextData || {},
      },
      include: {
        flow: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        initiator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create task executions for the first level
    const firstLevel = flow.levels.find((l) => l.order === 1);
    if (firstLevel && firstLevel.tasks.length > 0) {
      // For now, assign to the initiator. In production, you'd use role-based assignment
      for (const levelTask of firstLevel.tasks) {
        await this.createTaskExecution({
          taskId: levelTask.taskId,
          executorId: data.initiatorId,
          flowInstanceId: instance.id,
          levelId: firstLevel.id,
        });
      }
    }

    return this.mapToIFlowInstance(instance);
  }

  /**
   * Get flow instance by ID
   */
  async getFlowInstance(instanceId: string, userId: string): Promise<IFlowInstance> {
    const instance = await prisma.flowInstance.findUnique({
      where: { id: instanceId },
      include: {
        flow: {
          select: {
            id: true,
            name: true,
            description: true,
            levels: {
              orderBy: { order: 'asc' },
              include: {
                tasks: {
                  include: {
                    task: true,
                  },
                },
              },
            },
          },
        },
        initiator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        taskExecutions: {
          include: {
            task: true,
            executor: true,
          },
        },
      },
    });

    if (!instance) {
      throw new AppError(404, 'NOT_FOUND', 'Flow instance not found');
    }

    // Check access: initiator or participant
    const isParticipant =
      instance.initiatorId === userId ||
      instance.taskExecutions.some((te) => te.executorId === userId);

    if (!isParticipant) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
        throw new AppError(403, 'FORBIDDEN', 'Access denied');
      }
    }

    return this.mapToIFlowInstance(instance);
  }

  /**
   * List flow instances for a user (where they're initiator or participant)
   */
  async listFlowInstancesForUser(userId: string): Promise<IFlowInstance[]> {
    const instances = await prisma.flowInstance.findMany({
      where: {
        OR: [
          { initiatorId: userId },
          {
            taskExecutions: {
              some: {
                executorId: userId,
              },
            },
          },
        ],
      },
      include: {
        flow: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        initiator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    return instances.map((i) => this.mapToIFlowInstance(i));
  }

  /**
   * Progress flow instance to next level (internal method)
   */
  private async progressFlowInstance(instanceId: string): Promise<void> {
    const instance = await prisma.flowInstance.findUnique({
      where: { id: instanceId },
      include: {
        flow: {
          include: {
            levels: {
              orderBy: { order: 'asc' },
              include: {
                tasks: true,
              },
            },
          },
        },
        taskExecutions: true,
      },
    });

    if (!instance) return;

    // Check if all tasks in current level are completed
    const currentLevelTasks = instance.taskExecutions.filter(
      (te) => te.levelId && te.levelId === instance.flow.levels.find((l) => l.order === instance.currentLevelOrder)?.id
    );

    const allCompleted = currentLevelTasks.every((te) => te.status === 'COMPLETED');

    if (!allCompleted) return;

    // Move to next level
    const nextLevel = instance.flow.levels.find((l) => l.order === instance.currentLevelOrder + 1);

    if (nextLevel) {
      // Update flow instance to next level
      await prisma.flowInstance.update({
        where: { id: instanceId },
        data: {
          currentLevelOrder: nextLevel.order,
        },
      });

      // Create task executions for next level (assign to initiator for demo)
      for (const levelTask of nextLevel.tasks) {
        await this.createTaskExecution({
          taskId: levelTask.taskId,
          executorId: instance.initiatorId,
          flowInstanceId: instanceId,
          levelId: nextLevel.id,
        });
      }
    } else {
      // No more levels, mark flow as completed
      await prisma.flowInstance.update({
        where: { id: instanceId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }
  }

  // Mapping functions
  private mapToITaskExecution(execution: any): ITaskExecution {
    const executorName = execution.executor
      ? `${execution.executor.firstName || ''} ${execution.executor.lastName || ''}`.trim() ||
        execution.executor.email
      : 'Unknown';

    return {
      id: execution.id,
      taskId: execution.taskId,
      task: execution.task,
      executorId: execution.executorId,
      executor: execution.executor
        ? {
            id: execution.executor.id,
            email: execution.executor.email,
            name: executorName,
          }
        : undefined,
      flowInstanceId: execution.flowInstanceId,
      levelId: execution.levelId,
      status: execution.status,
      data: execution.data,
      createdAt: execution.createdAt.toISOString(),
      completedAt: execution.completedAt?.toISOString(),
    };
  }

  private mapToIFlowInstance(instance: any): IFlowInstance {
    const initiatorName = instance.initiator
      ? `${instance.initiator.firstName || ''} ${instance.initiator.lastName || ''}`.trim() ||
        instance.initiator.email
      : 'Unknown';

    return {
      id: instance.id,
      flowId: instance.flowId,
      flow: instance.flow,
      initiatorId: instance.initiatorId,
      initiator: instance.initiator
        ? {
            id: instance.initiator.id,
            email: instance.initiator.email,
            name: initiatorName,
          }
        : undefined,
      currentLevelOrder: instance.currentLevelOrder,
      status: instance.status,
      contextData: instance.contextData,
      startedAt: instance.startedAt.toISOString(),
      completedAt: instance.completedAt?.toISOString(),
    };
  }
}

export const executionService = new ExecutionService();

