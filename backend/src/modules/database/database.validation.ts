import { z } from 'zod';

// Table Field Schema
export const tableFieldSchema = z.object({
  id: z.string().optional(), // Will be generated if not provided
  name: z
    .string()
    .min(1, 'Field name is required')
    .regex(/^[a-z][a-z0-9_]*$/, 'Field name must be in snake_case'),
  displayName: z.string().min(1, 'Display name is required'),
  type: z.enum(['text', 'number', 'boolean', 'date', 'relation', 'computed']),
  required: z.boolean().default(false),
  unique: z.boolean().optional(),
  defaultValue: z.any().optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
    })
    .optional(),
  formula: z.string().optional(), // For computed fields
});

// Create Table Schema
export const createTableSchema = z.object({
  name: z
    .string()
    .min(1, 'Table name is required')
    .regex(/^[a-z][a-z0-9_]*$/, 'Table name must be in snake_case'),
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
});

// Update Table Schema
export const updateTableSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').optional(),
  description: z.string().optional(),
});

// Add Field Schema
export const addFieldSchema = tableFieldSchema.omit({ id: true });

// Update Field Schema
export const updateFieldSchema = tableFieldSchema.partial().omit({ id: true, name: true });

// Create Relation Schema
export const createRelationSchema = z.object({
  type: z.enum(['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many']),
  fromTable: z.string().uuid(),
  toTable: z.string().uuid(),
  fromField: z.string().min(1, 'From field is required'),
  toField: z.string().min(1, 'To field is required'),
});

// Insert Record Schema (dynamic based on table schema, but we'll validate structure)
export const insertRecordSchema = z.record(z.string(), z.any());

// Update Record Schema
export const updateRecordSchema = z.record(z.string(), z.any());

// Query Records Schema
export const queryRecordsSchema = z.object({
  filters: z.record(z.string(), z.any()).optional(),
  sort: z
    .object({
      field: z.string().min(1),
      order: z.enum(['asc', 'desc']),
    })
    .optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

