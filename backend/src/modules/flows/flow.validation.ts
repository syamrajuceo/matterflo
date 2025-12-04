import { z } from 'zod';

// Create Flow Schema
// Note: companyId and createdById come from authenticated user, not request body
export const createFlowSchema = z.object({
  name: z.string().min(1, 'Flow name is required').max(255, 'Flow name is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
});

// Update Flow Schema
export const updateFlowSchema = z.object({
  name: z.string().min(1, 'Flow name is required').max(255, 'Flow name is too long').optional(),
  description: z.string().max(1000, 'Description is too long').optional(),
  config: z.any().optional(),
});

// Create Flow Level Schema
export const createFlowLevelSchema = z.object({
  name: z.string().min(1, 'Level name is required').max(255, 'Level name is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  order: z.number().int().min(0).optional(),
  config: z.any().optional(),
});

// Update Flow Level Schema
export const updateFlowLevelSchema = z.object({
  name: z.string().min(1, 'Level name is required').max(255, 'Level name is too long').optional(),
  description: z.string().max(1000, 'Description is too long').optional(),
  config: z.any().optional(),
});

// Reorder Levels Schema
export const reorderLevelsSchema = z.object({
  levelIds: z.array(z.string().uuid()).min(1, 'At least one level ID is required'),
});

// Create Flow Branch Schema
export const createFlowBranchSchema = z.object({
  name: z.string().min(1, 'Branch name is required').max(255, 'Branch name is too long'),
  fromLevelId: z.string().uuid('Invalid from level ID'),
  toLevelId: z.string().uuid('Invalid to level ID'),
  conditions: z.any(), // JSON object for conditions
  priority: z.number().int().min(0).optional().default(0),
});

// Update Flow Branch Schema
export const updateFlowBranchSchema = z.object({
  name: z.string().min(1, 'Branch name is required').max(255, 'Branch name is too long').optional(),
  conditions: z.any().optional(),
  priority: z.number().int().min(0).optional(),
});

// Add Task to Level Schema
export const addTaskToLevelSchema = z.object({
  taskId: z.string().uuid('Invalid task ID'),
  order: z.number().int().min(0).optional(),
  config: z.any().optional(),
});

// Reorder Tasks in Level Schema
export const reorderTasksInLevelSchema = z.object({
  taskIds: z.array(z.string().uuid()).min(1, 'At least one task ID is required'),
});

// Add Role to Level Schema
export const addRoleToLevelSchema = z.object({
  roleId: z.string().uuid('Invalid role ID'),
});

// Duplicate Flow Schema
export const duplicateFlowSchema = z.object({
  name: z.string().min(1, 'Flow name is required').max(255, 'Flow name is too long'),
});

