import type { IFlowAction, IActionExecutionResult } from '../trigger.types';
import { prisma } from '../../../common/config/database.config';

/**
 * Execute flow action - start a new flow instance
 */
export async function startFlow(
  action: IFlowAction,
  context: Record<string, any>
): Promise<IActionExecutionResult> {
  const startTime = Date.now();

  try {
    // Verify flow exists
    const flow = await prisma.flow.findUnique({
      where: { id: action.flowId },
    });

    if (!flow) {
      throw new Error(`Flow with ID ${action.flowId} not found`);
    }

    if (flow.status !== 'PUBLISHED' && flow.status !== 'ACTIVE') {
      throw new Error(`Flow ${flow.name} is not published or active`);
    }

    // Get the first level
    const firstLevel = await prisma.flowLevel.findFirst({
      where: { flowId: action.flowId },
      orderBy: { order: 'asc' },
    });

    if (!firstLevel) {
      throw new Error(`Flow ${flow.name} has no levels`);
    }

    // Get initiator from context or use system user
    const initiatorId = context.userId || context.initiatorId || context.user?.id;
    if (!initiatorId) {
      throw new Error('No initiator ID found in context');
    }

    // Create flow instance
    const flowInstance = await prisma.flowInstance.create({
      data: {
        flowId: action.flowId,
        initiatorId,
        currentLevelOrder: firstLevel.order,
        contextData: {
          ...context,
          ...action.contextData,
        },
        status: 'IN_PROGRESS',
      },
    });

    const executionTime = Date.now() - startTime;

    return {
      action,
      success: true,
      result: {
        flowInstanceId: flowInstance.id,
        flowName: flow.name,
        started: true,
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

