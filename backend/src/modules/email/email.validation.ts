import { z } from 'zod';

export const createEmailTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  subject: z.string().min(1, 'Subject is required').max(200),
  body: z.string().min(1, 'Body is required'),
  variables: z.array(z.string()).optional(),
  type: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateEmailTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  subject: z.string().min(1).max(200).optional(),
  body: z.string().min(1).optional(),
  variables: z.array(z.string()).optional(),
  type: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const sendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().optional(),
  body: z.string().optional(),
  templateId: z.string().uuid().optional(),
  variables: z.record(z.string(), z.any()).optional(),
  from: z.string().email().optional(),
});

export const previewTemplateSchema = z.object({
  sampleVariables: z.record(z.string(), z.any()).optional(),
});

