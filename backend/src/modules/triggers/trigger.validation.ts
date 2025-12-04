import { z } from 'zod';
import { EventType } from '@prisma/client';

// Condition schemas
const conditionOperatorSchema = z.enum(['=', '!=', '>', '<', '>=', '<=', 'contains', 'not_contains', 'in', 'not_in', 'is_null', 'is_not_null']);

// Use z.any() for recursive conditions - validation will be done at runtime
const conditionSchema = z.object({
  field: z.string().min(1),
  operator: conditionOperatorSchema,
  value: z.any().optional(),
});

const conditionGroupSchema = z.object({
  operator: z.enum(['AND', 'OR']),
  conditions: z.array(z.union([conditionSchema, z.any()])).min(1), // Use z.any() for recursive groups
});

// Action schemas
const emailActionSchema = z.object({
  type: z.literal('email'),
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1),
  body: z.string().min(1),
  templateId: z.string().optional(),
  variables: z.record(z.string(), z.any()).optional(),
});

const flowActionSchema = z.object({
  type: z.literal('flow'),
  flowId: z.string().uuid(),
  contextData: z.record(z.string(), z.any()).optional(),
});

const databaseActionSchema = z.object({
  type: z.literal('database'),
  tableId: z.string().uuid(),
  operation: z.enum(['create', 'update', 'delete']),
  data: z.record(z.string(), z.any()).optional(),
  where: z.record(z.string(), z.any()).optional(),
});

const webhookActionSchema = z.object({
  type: z.literal('webhook'),
  url: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.any().optional(),
});

const taskActionSchema = z.object({
  type: z.literal('task'),
  taskId: z.string().uuid(),
  assignTo: z.string().uuid().optional(),
  contextData: z.record(z.string(), z.any()).optional(),
});

const actionSchema = z.discriminatedUnion('type', [
  emailActionSchema,
  flowActionSchema,
  databaseActionSchema,
  webhookActionSchema,
  taskActionSchema,
]);

// Trigger schemas
export const createTriggerSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional().default(true),
  eventType: z.nativeEnum(EventType),
  eventConfig: z.record(z.string(), z.any()).optional().default({}),
  conditions: z.union([conditionSchema, conditionGroupSchema]).optional(),
  actions: z.array(actionSchema).min(1, 'At least one action is required'),
  settings: z
    .object({
      stopOnError: z.boolean().optional(),
      timeout: z.number().int().positive().optional(),
      retryOnFailure: z.boolean().optional(),
      maxRetries: z.number().int().nonnegative().optional(),
    })
    .optional()
    .default({}),
  taskId: z.string().uuid().optional(),
  flowId: z.string().uuid().optional(),
});

export const updateTriggerSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
  eventType: z.nativeEnum(EventType).optional(),
  eventConfig: z.record(z.string(), z.any()).optional(),
  conditions: z.union([conditionSchema, conditionGroupSchema]).optional(),
  actions: z.array(actionSchema).optional(),
  settings: z
    .object({
      stopOnError: z.boolean().optional(),
      timeout: z.number().int().positive().optional(),
      retryOnFailure: z.boolean().optional(),
      maxRetries: z.number().int().nonnegative().optional(),
    })
    .optional(),
  taskId: z.string().uuid().nullable().optional(),
  flowId: z.string().uuid().nullable().optional(),
});

export const testTriggerSchema = z.object({
  sampleData: z.record(z.string(), z.any()),
});

