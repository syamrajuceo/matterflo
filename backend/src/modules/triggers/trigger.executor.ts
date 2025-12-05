import type { ITrigger, IAction, IActionExecutionResult } from './trigger.types';
import { sendEmail } from './actions/email.action';
import { startFlow } from './actions/flow.action';
import { updateDatabase } from './actions/database.action';
import { callWebhook } from './actions/webhook.action';
import { assignTask } from './actions/task.action';
import { generatePdf } from './actions/pdf.action';

export class TriggerExecutor {
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds

  /**
   * Execute all actions for a trigger
   */
  async execute(
    trigger: ITrigger,
    eventData: Record<string, any>
  ): Promise<IActionExecutionResult[]> {
    const results: IActionExecutionResult[] = [];
    const stopOnError = trigger.settings?.stopOnError ?? false;
    const timeout = trigger.settings?.timeout ?? this.DEFAULT_TIMEOUT;

    for (const action of trigger.actions) {
      try {
        const result = await Promise.race([
          this.executeAction(action, eventData),
          this.createTimeout(timeout),
        ]);

        if (result === 'timeout') {
          const timeoutResult: IActionExecutionResult = {
            action,
            success: false,
            error: `Action timed out after ${timeout}ms`,
            executionTime: timeout,
          };
          results.push(timeoutResult);
          
          // Stop on error if configured
          if (stopOnError) {
            break;
          }
        } else {
          const actionResult = result as IActionExecutionResult;
          results.push(actionResult);
          
          // Stop on error if configured
          if (stopOnError && !actionResult.success) {
            break;
          }
        }
      } catch (error) {
        results.push({
          action,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          executionTime: 0,
        });

        if (stopOnError) {
          break;
        }
      }
    }

    return results;
  }

  /**
   * Execute a single action
   */
  private async executeAction(
    action: IAction,
    context: Record<string, any>
  ): Promise<IActionExecutionResult> {
    switch (action.type) {
      case 'email':
        return await sendEmail(action, context);
      case 'flow':
        return await startFlow(action, context);
      case 'database':
        return await updateDatabase(action, context);
      case 'webhook':
        return await callWebhook(action, context);
      case 'task':
        return await assignTask(action, context);
      case 'pdf':
        return await generatePdf(action, context);
      default:
        return {
          action,
          success: false,
          error: `Unknown action type: ${(action as any).type}`,
          executionTime: 0,
        };
    }
  }

  /**
   * Create a timeout promise
   */
  private createTimeout(ms: number): Promise<'timeout'> {
    return new Promise((resolve) => {
      setTimeout(() => resolve('timeout'), ms);
    });
  }
}

