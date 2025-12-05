import type { IEmailAction, IActionExecutionResult } from '../trigger.types';
import { emailService } from '../../email/email.service';

/**
 * Execute email action
 * Uses the email service to send real emails
 */
export async function sendEmail(
  action: IEmailAction,
  context: Record<string, any>
): Promise<IActionExecutionResult> {
  const startTime = Date.now();

  try {
    const recipients = Array.isArray(action.to) ? action.to : [action.to];
    
    // Prepare email request
    const emailRequest: any = {
      to: recipients,
      variables: { ...context, ...action.variables },
    };

    // If templateId provided, use template
    if (action.templateId) {
      emailRequest.templateId = action.templateId;
    } else {
      // Use direct subject and body
      emailRequest.subject = action.subject;
      emailRequest.body = action.body;
    }

    // Send email using email service
    const result = await emailService.sendEmail(emailRequest);

    const executionTime = Date.now() - startTime;

    return {
      action,
      success: result.success,
      result: {
        recipients,
        messageId: result.messageId,
        sent: result.success,
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

