import axios, { AxiosRequestConfig } from 'axios';
import type { IWebhookAction, IActionExecutionResult } from '../trigger.types';

/**
 * Execute webhook action - call external webhook
 */
export async function callWebhook(
  action: IWebhookAction,
  context: Record<string, any>
): Promise<IActionExecutionResult> {
  const startTime = Date.now();

  try {
    // Merge context into body if body exists
    let body = action.body;
    if (body && typeof body === 'object') {
      body = {
        ...body,
        ...context,
      };
    } else if (!body) {
      body = context;
    }

    // Prepare request config
    const config: AxiosRequestConfig = {
      method: action.method,
      url: action.url,
      headers: {
        'Content-Type': 'application/json',
        ...action.headers,
      },
      timeout: 30000, // 30 seconds
    };

    // Add body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(action.method)) {
      config.data = body;
    } else if (action.method === 'GET') {
      config.params = body;
    }

    // Make the request
    const response = await axios(config);

    const executionTime = Date.now() - startTime;

    return {
      action,
      success: true,
      result: {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
      },
      executionTime,
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    return {
      action,
      success: false,
      error: error?.response?.data?.message || error?.message || 'Unknown error',
      executionTime,
    };
  }
}

