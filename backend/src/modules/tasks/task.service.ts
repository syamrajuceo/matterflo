import { TaskStatus } from '@prisma/client';
import { prisma } from '../../common/config/database.config';
import { NotFoundError, ValidationError } from '../../common/errors';
import { ITask, ITaskField, ICreateTaskRequest, IUpdateTaskRequest, IListTasksFilters, IListTasksResponse } from './task.types';
import { randomUUID } from 'crypto';

class TaskService {
  // Create new task
  async createTask(data: ICreateTaskRequest): Promise<ITask> {
    try {
      const task = await prisma.task.create({
        data: {
          name: data.name,
          description: data.description || null,
          version: '1.0',
          status: TaskStatus.DRAFT,
          fields: [],
          validations: [],
          logic: {},
          companyId: data.companyId,
          createdById: data.createdById,
        },
      });

      return this.mapTaskToITask(task);
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  // Get task by ID
  async getTask(id: string): Promise<ITask | null> {
    try {
      const task = await prisma.task.findUnique({
        where: { id },
      });

      if (!task) {
        return null;
      }

      return this.mapTaskToITask(task);
    } catch (error) {
      console.error('Error getting task:', error);
      throw error;
    }
  }

  // List tasks with filters
  async listTasks(filters: IListTasksFilters): Promise<IListTasksResponse> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {
        companyId: filters.companyId,
        // Exclude archived tasks by default
        status: {
          not: 'ARCHIVED'
        }
      };

      // If status filter is explicitly provided, override the default
      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          skip,
          take: limit,
          orderBy: { updatedAt: 'desc' },
        }),
        prisma.task.count({ where }),
      ]);

      return {
        tasks: tasks.map((task) => this.mapTaskToITask(task)),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error listing tasks:', error);
      throw error;
    }
  }

  // Update task
  async updateTask(id: string, data: IUpdateTaskRequest): Promise<ITask> {
    try {
      const existingTask = await prisma.task.findUnique({
        where: { id },
      });

      if (!existingTask) {
        throw new NotFoundError('Task');
      }

      // Cannot update if status is PUBLISHED
      if (existingTask.status === TaskStatus.PUBLISHED) {
        throw new ValidationError('Cannot update a published task. Create a new version instead.', {});
      }

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.fields !== undefined) updateData.fields = data.fields;
      if (data.logic !== undefined) updateData.logic = data.logic;

      const task = await prisma.task.update({
        where: { id },
        data: updateData,
      });

      return this.mapTaskToITask(task);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  // Add field to task
  async addField(taskId: string, field: Omit<ITaskField, 'id' | 'order'>): Promise<ITask> {
    try {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new NotFoundError('Task');
      }

      if (task.status === TaskStatus.PUBLISHED) {
        throw new ValidationError('Cannot modify fields of a published task.', {});
      }

      const fields = (task.fields as unknown as ITaskField[]) || [];
      const maxOrder = fields.length > 0 ? Math.max(...fields.map((f) => f.order)) : -1;

      const newField: ITaskField = {
        id: randomUUID(),
        ...field,
        order: maxOrder + 1,
      };

      const updatedFields = [...fields, newField];

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: { fields: updatedFields as any },
      });

      return this.mapTaskToITask(updatedTask);
    } catch (error) {
      console.error('Error adding field:', error);
      throw error;
    }
  }

  // Update field
  async updateField(taskId: string, fieldId: string, data: Partial<ITaskField>): Promise<ITask> {
    try {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new NotFoundError('Task');
      }

      if (task.status === TaskStatus.PUBLISHED) {
        throw new ValidationError('Cannot modify fields of a published task.', {});
      }

      const fields = (task.fields as unknown as ITaskField[]) || [];
      const fieldIndex = fields.findIndex((f) => f.id === fieldId);

      if (fieldIndex === -1) {
        throw new NotFoundError('Field');
      }

      // Don't allow updating id or order through this method
      const { id, order, ...updateData } = data;
      fields[fieldIndex] = { ...fields[fieldIndex], ...updateData };

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: { fields: fields as any },
      });

      return this.mapTaskToITask(updatedTask);
    } catch (error) {
      console.error('Error updating field:', error);
      throw error;
    }
  }

  // Delete field
  async deleteField(taskId: string, fieldId: string): Promise<ITask> {
    try {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new NotFoundError('Task');
      }

      if (task.status === TaskStatus.PUBLISHED) {
        throw new ValidationError('Cannot modify fields of a published task.', {});
      }

      const fields = (task.fields as unknown as ITaskField[]) || [];
      const filteredFields = fields.filter((f) => f.id !== fieldId);

      // Reorder remaining fields
      const reorderedFields = filteredFields.map((field, index) => ({
        ...field,
        order: index,
      }));

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: { fields: reorderedFields as any },
      });

      return this.mapTaskToITask(updatedTask);
    } catch (error) {
      console.error('Error deleting field:', error);
      throw error;
    }
  }

  // Reorder fields
  async reorderFields(taskId: string, fieldIds: string[]): Promise<ITask> {
    try {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new NotFoundError('Task');
      }

      if (task.status === TaskStatus.PUBLISHED) {
        throw new ValidationError('Cannot modify fields of a published task.', {});
      }

      const fields = (task.fields as unknown as ITaskField[]) || [];
      const fieldMap = new Map(fields.map((f) => [f.id, f]));

      // Validate all field IDs exist
      const missingFieldIds: string[] = [];
      for (const fieldId of fieldIds) {
        if (!fieldMap.has(fieldId)) {
          missingFieldIds.push(fieldId);
        }
      }
      
      if (missingFieldIds.length > 0) {
        console.error(`[ReorderFields] Missing field IDs: ${missingFieldIds.join(', ')}`);
        console.error(`[ReorderFields] Available field IDs: ${Array.from(fieldMap.keys()).join(', ')}`);
        throw new NotFoundError(`Field(s) not found: ${missingFieldIds.join(', ')}`);
      }

      // Reorder fields based on provided order
      const reorderedFields = fieldIds.map((fieldId, index) => ({
        ...fieldMap.get(fieldId)!,
        order: index,
      }));

      // Add any fields not in the reorder list at the end
      const remainingFields = fields
        .filter((f) => !fieldIds.includes(f.id))
        .map((field, index) => ({
          ...field,
          order: fieldIds.length + index,
        }));

      const allFields = [...reorderedFields, ...remainingFields];

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: { fields: allFields as any },
      });

      return this.mapTaskToITask(updatedTask);
    } catch (error) {
      console.error('Error reordering fields:', error);
      throw error;
    }
  }

  // Publish task
  async publishTask(id: string): Promise<ITask> {
    try {
      const task = await prisma.task.findUnique({
        where: { id },
      });

      if (!task) {
        throw new NotFoundError('Task');
      }

      if (task.status === TaskStatus.PUBLISHED) {
        throw new ValidationError('Task is already published.', {});
      }

      const updatedTask = await prisma.task.update({
        where: { id },
        data: {
          status: TaskStatus.PUBLISHED,
          publishedAt: new Date(),
        },
      });

      return this.mapTaskToITask(updatedTask);
    } catch (error) {
      console.error('Error publishing task:', error);
      throw error;
    }
  }

  // Delete task (soft delete)
  async deleteTask(id: string): Promise<void> {
    try {
      const task = await prisma.task.findUnique({
        where: { id },
      });

      if (!task) {
        throw new NotFoundError('Task');
      }

      await prisma.task.update({
        where: { id },
        data: { status: TaskStatus.ARCHIVED },
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  // Duplicate task
  async duplicateTask(id: string, newName: string): Promise<ITask> {
    try {
      const originalTask = await prisma.task.findUnique({
        where: { id },
      });

      if (!originalTask) {
        throw new NotFoundError('Task');
      }

      // Increment version
      const versionParts = originalTask.version.split('.');
      const majorVersion = parseInt(versionParts[0]) || 1;
      const newVersion = `${majorVersion + 1}.0`;

      const duplicatedTask = await prisma.task.create({
        data: {
          name: newName,
          description: originalTask.description,
          version: newVersion,
          status: TaskStatus.DRAFT,
          fields: originalTask.fields as any,
          validations: originalTask.validations as any,
          logic: originalTask.logic as any,
          companyId: originalTask.companyId,
          createdById: originalTask.createdById,
        },
      });

      return this.mapTaskToITask(duplicatedTask);
    } catch (error) {
      console.error('Error duplicating task:', error);
      throw error;
    }
  }

  // Helper method to map Prisma Task to ITask
  private mapTaskToITask(task: any): ITask {
    return {
      id: task.id,
      name: task.name,
      description: task.description || undefined,
      version: task.version,
      status: task.status as ITask['status'],
      fields: (task.fields as unknown as ITaskField[]) || [],
      validations: (task.validations as unknown as any[]) || [],
      logic: (task.logic as any) || {},
      companyId: task.companyId,
      createdById: task.createdById,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      publishedAt: task.publishedAt || undefined,
    };
  }
}

export const taskService = new TaskService();

