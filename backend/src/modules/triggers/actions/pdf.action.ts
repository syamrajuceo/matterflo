import type { IPdfAction, IActionExecutionResult } from '../trigger.types';
import { pdfService } from '../../pdf/pdf.service';
import { emailService } from '../../email/email.service';
import fs from 'fs';

/**
 * Execute PDF generation action
 * Generates PDF from task, flow, or custom template
 */
export async function generatePdf(
  action: IPdfAction,
  context: Record<string, any>
): Promise<IActionExecutionResult> {
  const startTime = Date.now();

  try {
    let result: { filePath: string; filename: string };

    switch (action.sourceType) {
      case 'task':
        if (!action.sourceId) {
          throw new Error('Task ID is required for task PDF generation');
        }
        result = await pdfService.generateTaskPdf(action.sourceId, {
          includeData: action.includeData ?? true,
          variables: { ...context, ...action.variables },
        });
        break;

      case 'flow':
        if (!action.sourceId) {
          throw new Error('Flow instance ID is required for flow PDF generation');
        }
        result = await pdfService.generateFlowPdf(action.sourceId, {
          includeData: action.includeData ?? true,
          variables: { ...context, ...action.variables },
        });
        break;

      case 'custom':
        if (!action.template) {
          throw new Error('Template is required for custom PDF generation');
        }
        const templateData = { ...context, ...action.variables };
        const filename = action.filename
          ? replaceVariables(action.filename, templateData)
          : undefined;
        result = await pdfService.generateCustomPdf(action.template, templateData, filename);
        break;

      default:
        throw new Error(`Unknown PDF source type: ${action.sourceType}`);
    }

    // If attachToEmail is true, attach to the email action at the specified index
    if (action.attachToEmail && action.emailActionIndex !== undefined) {
      // Store PDF path in context for email action to use
      context._pdfAttachment = {
        path: result.filePath,
        filename: result.filename,
      };
    }

    const executionTime = Date.now() - startTime;

    return {
      action,
      success: true,
      result: {
        filePath: result.filePath,
        filename: result.filename,
        generated: true,
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

/**
 * Replace variables in string (e.g., {{variableName}})
 */
function replaceVariables(template: string, variables: Record<string, any>): string {
  let result = template;
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, String(variables[key]));
  });
  return result;
}

