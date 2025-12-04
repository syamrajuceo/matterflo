import { prisma } from '../../common/config/database.config';
import { executionService } from '../execution/execution.service';
import type {
  IClientDashboardStats,
  IClientFlowInstance,
  IClientFlowStep,
  IClientPendingTasksResponse,
  IClientTask,
  IClientTaskCompletionRequest,
  IClientTaskExecution,
  IClientTaskSummary,
} from './client.types';

class ClientService {
  /**
   * Get dashboard statistics for the client user
   */
  async getDashboardStats(userId: string): Promise<IClientDashboardStats> {
    const [pendingCount, urgentCount, completedCount, activeFlowsData] = await Promise.all([
      prisma.taskExecution.count({
        where: {
          executorId: userId,
          status: 'PENDING',
        },
      }),
      prisma.taskExecution.count({
        where: {
          executorId: userId,
          status: 'PENDING',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
      prisma.taskExecution.count({
        where: {
          executorId: userId,
          status: 'COMPLETED',
        },
      }),
      prisma.flowInstance.findMany({
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
          status: 'IN_PROGRESS',
        },
        include: {
          flow: {
            select: {
              name: true,
              levels: {
                select: {
                  id: true,
                  order: true,
                },
              },
            },
          },
        },
        take: 5,
      }),
    ]);

    const activeWorkflows = activeFlowsData.map((instance) => ({
      id: instance.id,
      name: instance.flow?.name || 'Unnamed Flow',
      stepsCompleted: instance.currentLevelOrder - 1,
      totalSteps: instance.flow?.levels.length || 0,
    }));

    return {
      pendingCount,
      urgentCount,
      completedCount,
      activeWorkflows,
    };
  }

  /**
   * Get pending tasks for the client user
   */
  async getPendingTasksForUser(userId: string): Promise<IClientPendingTasksResponse> {
    const executions = await executionService.listTaskExecutionsForUser(userId, 'PENDING');

    const tasks: IClientTaskSummary[] = executions.map((execution) => {
      const dueDate = execution.createdAt;
      const now = new Date();
      const created = new Date(dueDate);
      const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

      let dueString = 'No deadline';
      let priority: 'urgent' | 'normal' = 'normal';

      if (hoursDiff > 24) {
        dueString = 'Overdue';
        priority = 'urgent';
      } else if (hoursDiff > 12) {
        dueString = 'Due soon';
        priority = 'urgent';
      } else if (hoursDiff > 6) {
        dueString = 'Today';
        priority = 'normal';
      } else {
        dueString = 'Just assigned';
        priority = 'normal';
      }

      return {
        id: execution.id,
        title: execution.task?.name || 'Unnamed Task',
        amount: '', // Could extract from task data if needed
        due: dueString,
        priority,
        status: 'PENDING',
      };
    });

    return { tasks };
  }

  /**
   * Get task execution details for completion
   */
  async getTaskExecutionForUser(
    executionId: string,
    userId: string
  ): Promise<IClientTaskExecution> {
    const execution = await executionService.getTaskExecution(executionId, userId);

    // Format submitted data to match expected structure
    const submittedData = {
      employeeName: (execution.data?.employeeName as string) || execution.executor?.name || 'Unknown',
      amount: (execution.data?.amount as string) || '',
      category: (execution.data?.category as string) || '',
      receiptFileName: (execution.data?.receiptFileName as string) || '',
      description: (execution.data?.description as string) || '',
    };

    // Build task fields for the form
    const fields = (execution.task?.fields as any[]) || [];

    return {
      id: execution.id,
      title: execution.task?.name || 'Unnamed Task',
      submittedBy: execution.executor?.name || 'Unknown',
      submittedAt: new Date(execution.createdAt).toLocaleString(),
      submittedData,
      fields: fields.map((f: any) => ({
        id: f.id || f.name,
        name: f.name,
        label: f.label || f.name,
        type: f.type === 'textarea' ? 'textarea' : f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text',
        required: f.required || false,
      })),
      status: 'PENDING',
    };
  }

  /**
   * Complete a task (submit response)
   */
  async completeTask(
    executionId: string,
    userId: string,
    data: IClientTaskCompletionRequest
  ): Promise<void> {
    await executionService.updateTaskExecution(executionId, userId, {
      data: data.data,
      status: 'COMPLETED',
    });
  }

  /**
   * Get flow instances for the client user
   */
  async getMyFlowInstances(userId: string): Promise<IClientFlowInstance[]> {
    const instances = await executionService.listFlowInstancesForUser(userId);

    return instances.map((instance) => {
      const steps: IClientFlowStep[] = []; // Empty for now, will populate in detailed view
      return {
        id: instance.id,
        name: instance.flow?.name || 'Unnamed Flow',
        instanceNumber: `#${instance.id.substring(0, 8)}`,
        startedAt: new Date(instance.startedAt).toLocaleString(),
        steps,
      };
    });
  }

  /**
   * Get a specific flow instance with details
   */
  async getFlowInstanceForUser(
    instanceId: string,
    userId: string
  ): Promise<IClientFlowInstance> {
    const instance = await executionService.getFlowInstance(instanceId, userId);

    // Build step information from flow levels (if available)
    const fullInstance = await prisma.flowInstance.findUnique({
      where: { id: instanceId },
      include: {
        flow: {
          include: {
            levels: {
              orderBy: { order: 'asc' },
            },
          },
        },
        taskExecutions: {
          include: {
            executor: true,
          },
        },
      },
    });

    const steps =
      fullInstance?.flow.levels.map((level, index) => {
        const levelExecutions = fullInstance.taskExecutions.filter(
          (te) => te.levelId === level.id
        );

        let status: 'COMPLETED' | 'CURRENT' | 'PENDING' = 'PENDING';
        let completedBy: string | undefined;
        let completedAt: string | undefined;
        let assignedTo: string | undefined;

        if (levelExecutions.length > 0) {
          const allCompleted = levelExecutions.every((te) => te.status === 'COMPLETED');
          if (allCompleted) {
            status = 'COMPLETED';
            completedBy = levelExecutions[0].executor
              ? `${levelExecutions[0].executor.firstName || ''} ${
                  levelExecutions[0].executor.lastName || ''
                }`.trim() || levelExecutions[0].executor.email
              : 'Unknown';
            completedAt = levelExecutions[0].completedAt
              ? new Date(levelExecutions[0].completedAt).toLocaleString()
              : undefined;
          } else if (level.order === fullInstance.currentLevelOrder) {
            status = 'CURRENT';
            assignedTo = levelExecutions[0].executor
              ? `${levelExecutions[0].executor.firstName || ''} ${
                  levelExecutions[0].executor.lastName || ''
                }`.trim() || levelExecutions[0].executor.email
              : 'Unknown';
          }
        }

        return {
          id: level.id,
          name: `Step ${index + 1}: ${level.name}`,
          status,
          completedBy,
          completedAt,
          assignedTo,
          due: undefined, // Could calculate from task execution dates
        };
      }) || [];

    return {
      id: instance.id,
      name: instance.flow?.name || 'Unnamed Flow',
      instanceNumber: `#${instance.id.substring(0, 8)}`,
      startedAt: new Date(instance.startedAt).toLocaleString(),
      steps,
    };
  }
}

export const clientService = new ClientService();
