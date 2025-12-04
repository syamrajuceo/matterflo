import { z } from 'zod';

// Create Dataset Schema
export const createDatasetSchema = z.object({
  name: z.string().min(1, 'Dataset name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  visibility: z
    .object({
      roles: z.array(z.string()).optional(),
      users: z.array(z.string()).optional(),
    })
    .optional(),
});

// Update Dataset Schema
export const updateDatasetSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  visibility: z
    .object({
      roles: z.array(z.string()).optional(),
      users: z.array(z.string()).optional(),
    })
    .optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

// Add Section Schema
export const addSectionSchema = z.object({
  type: z.enum(['tasks', 'data-table', 'data-chart', 'data-cards', 'text']),
  title: z.string().min(1, 'Section title is required'),
  config: z.any(), // Type-specific configuration
});

// Update Section Schema
export const updateSectionSchema = z.object({
  title: z.string().min(1).optional(),
  config: z.any().optional(),
});

// Reorder Sections Schema
export const reorderSectionsSchema = z.object({
  sectionIds: z.array(z.string().uuid()).min(1, 'At least one section ID is required'),
});

