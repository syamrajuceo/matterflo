import type { ITaskAction, IActionExecutionResult } from '../trigger.types';
import { prisma } from '../../../common/config/database.config';

/**
 * Execute task action - assign a task to a user
 */
export async function assignTask(
  action: ITaskAction,
  context: Record<string, any>
): Promise<IActionExecutionResult> {
  const startTime = Date.now();

  try {
    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: action.taskId },
    });

    if (!task) {
      throw new Error(`Task with ID ${action.taskId} not found`);
    }

    if (task.status !== 'PUBLISHED') {
      throw new Error(`Task ${task.name} is not published`);
    }

    // Get assignee
    const assignTo = action.assignTo || context.userId || context.user?.id;
    if (!assignTo) {
      throw new Error('No assignee specified and no user ID found in context');
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: assignTo },
    });

    if (!user) {
      throw new Error(`User with ID ${assignTo} not found`);
    }

    // Create task execution
    const taskExecution = await prisma.taskExecution.create({
      data: {
        taskId: action.taskId,
        executorId: assignTo,
        data: {
          ...context,
          ...action.contextData,
        } as any,
        status: 'PENDING',
        flowInstanceId: context.flowInstanceId || null,
        levelId: context.levelId || null,
      },
    });

    const executionTime = Date.now() - startTime;

    return {
      action,
      success: true,
      result: {
        taskExecutionId: taskExecution.id,
        taskName: task.name,
        assignedTo: assignTo,
        assigned: true,
      },
      executionTime,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return {
      action,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime,
    };
  }
}

