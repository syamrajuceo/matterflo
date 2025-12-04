import { z } from 'zod';

// Task Field Schema
export const taskFieldSchema = z.object({
  id: z.string().optional(), // Will be generated if not provided
  type: z.enum(['text', 'number', 'date', 'dropdown', 'multi-select', 'checkbox', 'file', 'image', 'rich-text', 'field-group']),
  label: z.string().min(1, 'Label is required'),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  validation: z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    options: z.array(z.string()).optional(), // for dropdown/multi-select
  }).optional(),
  conditionalLogic: z.object({
    showIf: z.array(z.object({
      fieldId: z.string(),
      operator: z.enum(['equals', 'not_equals', 'contains']),
      value: z.any(),
    })),
  }).optional(),
  order: z.number().int().min(0),
});

// Create Task Schema
// Note: companyId and createdById come from authenticated user, not request body
export const createTaskSchema = z.object({
  name: z.string().min(1, 'Task name is required').max(255, 'Task name is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
});

// Update Task Schema
export const updateTaskSchema = z.object({
  name: z.string().min(1, 'Task name is required').max(255, 'Task name is too long').optional(),
  description: z.string().max(1000, 'Description is too long').optional(),
  fields: z.array(taskFieldSchema).optional(),
  logic: z.any().optional(), // JSON object for conditional logic
});

// Add Field Schema
export const addFieldSchema = taskFieldSchema.partial({ id: true, order: true });

// Update Field Schema
export const updateFieldSchema = taskFieldSchema.partial();

// Reorder Fields Schema
export const reorderFieldsSchema = z.object({
  fieldIds: z.array(z.string().uuid()).min(1, 'At least one field ID is required'),
});

// Duplicate Task Schema
export const duplicateTaskSchema = z.object({
  name: z.string().min(1, 'Task name is required').max(255, 'Task name is too long'),
});

