import { z } from 'zod';

export const createIntegrationSchema = z.object({
  name: z.string().min(1, 'Integration name is required'),
  type: z.enum(['GMAIL', 'GOOGLE_SHEETS', 'OUTLOOK', 'WEBHOOK', 'CUSTOM_API']),
  config: z.record(z.string(), z.any()).optional().default({}),
});

export const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  triggerConfig: z.object({
    event: z.string().min(1),
    filters: z.record(z.string(), z.any()).optional(),
  }),
  actionConfig: z.object({
    action: z.string().min(1),
    params: z.record(z.string(), z.any()).optional(),
  }),
  isActive: z.boolean().optional(),
});


