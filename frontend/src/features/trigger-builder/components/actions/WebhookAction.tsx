import { useForm } from 'react-hook-form';
import type { IWebhookAction } from '../../types/action.types';

interface WebhookActionProps {
  action: IWebhookAction;
  onChange: (action: IWebhookAction) => void;
}

type WebhookActionFormData = {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  authType: 'none' | 'bearer' | 'api_key';
  token?: string;
  apiKey?: string;
  apiKeyHeader?: string;
};

export function WebhookAction({ action, onChange }: WebhookActionProps) {
  const { register, watch, formState: { errors } } = useForm<WebhookActionFormData>({
    defaultValues: {
      url: action.url || '',
      method: action.method || 'POST',
      headers: action.headers || {},
      body: typeof action.body === 'string' ? action.body : JSON.stringify(action.body || {}, null, 2),
      authType: action.auth?.type || 'none',
      token: action.auth?.token,
      apiKey: action.auth?.apiKey,
      apiKeyHeader: action.auth?.apiKeyHeader || 'X-API-Key',
    },
  });

  const url = watch('url');
  const method = watch('method');
  const body = watch('body');
  const authType = watch('authType');
  const token = watch('token');
  const apiKey = watch('apiKey');
  const apiKeyHeader = watch('apiKeyHeader');

  const handleChange = () => {
    let parsedBody: any;
    try {
      parsedBody = JSON.parse(body || '{}');
    } catch {
      parsedBody = body;
    }

    onChange({
      type: 'webhook',
      url: url,
      method: method,
      body: parsedBody,
      auth: authType !== 'none' ? {
        type: authType,
        ...(authType === 'bearer' ? { token: token } : {}),
        ...(authType === 'api_key' ? { apiKey: apiKey, apiKeyHeader: apiKeyHeader } : {}),
      } : undefined,
    });
  };

  return (
    <div className="space-y-4">
      {/* URL */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          URL <span className="text-red-400">*</span>
        </label>
        <input
          type="url"
          {...register('url', {
            required: 'URL is required',
            onChange: handleChange,
          })}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="https://api.example.com/webhook"
        />
        {errors.url && (
          <p className="mt-1 text-xs text-red-400">{errors.url.message}</p>
        )}
      </div>

      {/* Method */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Method
        </label>
        <div className="flex gap-4">
          {(['POST', 'PUT', 'PATCH'] as const).map((m) => (
            <label key={m} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={m}
                {...register('method', { onChange: handleChange })}
                className="h-4 w-4 rounded border border-border bg-background text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">{m}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Headers */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Headers
        </label>
        <div className="rounded-lg border bg-background p-3">
          <p className="mb-2 text-xs text-muted-foreground">Key-value pairs</p>
          <div className="space-y-2">
            {/* TODO: Implement key-value pair editor */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Header name"
                className="flex-1 rounded border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                placeholder="Value"
                className="flex-1 rounded border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                className="px-2 py-1 text-sm text-destructive hover:text-destructive/80"
              >
                ×
              </button>
            </div>
            <button
              type="button"
              className="text-xs text-primary hover:text-primary/80"
            >
              + Add Header
            </button>
          </div>
        </div>
      </div>

      {/* Body (for POST/PUT/PATCH) */}
      {['POST', 'PUT', 'PATCH'].includes(method) && (
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Body (JSON)
          </label>
          <textarea
            {...register('body', { onChange: handleChange })}
            rows={6}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder='{"key": "value"}'
          />
        </div>
      )}

      {/* Auth */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Authentication
        </label>
        <select
          {...register('authType', { onChange: handleChange })}
          className="mb-2 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="none">None</option>
          <option value="bearer">Bearer Token</option>
          <option value="api_key">API Key</option>
        </select>

        {authType === 'bearer' && (
          <input
            type="text"
            {...register('token', { onChange: handleChange })}
            className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Bearer token"
          />
        )}

        {authType === 'api_key' && (
          <div className="mt-2 space-y-2">
            <input
              type="text"
              {...register('apiKey', { onChange: handleChange })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="API Key"
            />
            <input
              type="text"
              {...register('apiKeyHeader', { onChange: handleChange })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Header name (e.g., X-API-Key)"
            />
          </div>
        )}
      </div>
    </div>
  );
}

