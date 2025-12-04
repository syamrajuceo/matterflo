import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export const moveDepartmentSchema = z.object({
  newParentId: z.string().uuid().nullable(),
});

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
  departmentId: z.union([z.string().uuid(), z.literal('__none__'), z.literal('')]).optional(),
  permissions: z.record(z.string(), z.boolean()),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  departmentId: z.union([z.string().uuid(), z.literal('__none__'), z.literal(''), z.null()]).optional(),
  permissions: z.record(z.string(), z.boolean()).optional(),
});


