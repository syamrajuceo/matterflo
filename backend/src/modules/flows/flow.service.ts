import { FlowStatus } from '@prisma/client';
import { prisma } from '../../common/config/database.config';
import { NotFoundError, ValidationError } from '../../common/errors';
import {
  IFlow,
  IFlowLevel,
  IFlowBranch,
  ICreateFlowRequest,
  IUpdateFlowRequest,
  ICreateFlowLevelRequest,
  IUpdateFlowLevelRequest,
  ICreateFlowBranchRequest,
  IAddTaskToLevelRequest,
  IListFlowsFilters,
  IListFlowsResponse,
} from './flow.types';

class FlowService {
  // Create new flow
  async createFlow(data: ICreateFlowRequest): Promise<IFlow> {
    try {
      const flow = await prisma.flow.create({
        data: {
          name: data.name,
          description: data.description || null,
          version: '1.0',
          status: FlowStatus.DRAFT,
          config: {},
          companyId: data.companyId,
          createdById: data.createdById,
        },
        include: {
          levels: {
            include: {
              tasks: {
                include: {
                  task: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
          branches: true,
        },
      });

      return this.mapFlowToIFlow(flow);
    } catch (error) {
      console.error('Error creating flow:', error);
      throw error;
    }
  }

  // Get flow by ID
  async getFlow(id: string): Promise<IFlow | null> {
    try {
      const flow = await prisma.flow.findUnique({
        where: { id },
        include: {
          levels: {
            include: {
              tasks: {
                include: {
                  task: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
          branches: true,
        },
      });

      if (!flow) {
        return null;
      }

      return this.mapFlowToIFlow(flow);
    } catch (error) {
      console.error('Error getting flow:', error);
      throw error;
    }
  }

  // List flows with filters
  async listFlows(filters: IListFlowsFilters): Promise<IListFlowsResponse> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {
        companyId: filters.companyId,
      };

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const [flows, total] = await Promise.all([
        prisma.flow.findMany({
          where,
          skip,
          take: limit,
          orderBy: { updatedAt: 'desc' },
          include: {
            levels: {
              orderBy: { order: 'asc' },
            },
          },
        }),
        prisma.flow.count({ where }),
      ]);

      return {
        flows: flows.map((flow) => this.mapFlowToIFlow(flow)),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error listing flows:', error);
      throw error;
    }
  }

  // Update flow
  async updateFlow(id: string, data: IUpdateFlowRequest): Promise<IFlow> {
    try {
      const existingFlow = await prisma.flow.findUnique({
        where: { id },
      });

      if (!existingFlow) {
        throw new NotFoundError('Flow');
      }

      // Cannot update if status is PUBLISHED
      if (existingFlow.status === FlowStatus.PUBLISHED) {
        throw new ValidationError('Cannot update a published flow. Create a new version instead.', {});
      }

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.config !== undefined) updateData.config = data.config as any;

      const flow = await prisma.flow.update({
        where: { id },
        data: updateData,
        include: {
          levels: {
            include: {
              tasks: {
                include: {
                  task: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
          branches: true,
        },
      });

      return this.mapFlowToIFlow(flow);
    } catch (error) {
      console.error('Error updating flow:', error);
      throw error;
    }
  }

  // Add level to flow
  async addLevel(flowId: string, data: ICreateFlowLevelRequest): Promise<IFlow> {
    try {
      const flow = await prisma.flow.findUnique({
        where: { id: flowId },
        include: { levels: true },
      });

      if (!flow) {
        throw new NotFoundError('Flow');
      }

      if (flow.status === FlowStatus.PUBLISHED) {
        throw new ValidationError('Cannot modify levels of a published flow.', {});
      }

      // Determine order
      const maxOrder = flow.levels.length > 0 ? Math.max(...flow.levels.map((l) => l.order)) : -1;
      const order = data.order !== undefined ? data.order : maxOrder + 1;

      // Check if order already exists
      const existingLevelWithOrder = flow.levels.find((l) => l.order === order);
      if (existingLevelWithOrder) {
        // Shift existing levels - need to update individually
        const levelsToShift = flow.levels.filter((l) => l.order >= order);
        for (const level of levelsToShift) {
          await prisma.flowLevel.update({
            where: { id: level.id },
            data: { order: level.order + 1 },
          });
        }
      }

      await prisma.flowLevel.create({
        data: {
          name: data.name,
          description: data.description || null,
          order,
          flowId,
          config: (data.config as any) || {},
        },
      });

      return this.getFlow(flowId) as Promise<IFlow>;
    } catch (error) {
      console.error('Error adding level:', error);
      throw error;
    }
  }

  // Update level
  async updateLevel(flowId: string, levelId: string, data: IUpdateFlowLevelRequest): Promise<IFlow> {
    try {
      const flow = await prisma.flow.findUnique({
        where: { id: flowId },
      });

      if (!flow) {
        throw new NotFoundError('Flow');
      }

      if (flow.status === FlowStatus.PUBLISHED) {
        throw new ValidationError('Cannot modify levels of a published flow.', {});
      }

      const level = await prisma.flowLevel.findUnique({
        where: { id: levelId },
      });

      if (!level || level.flowId !== flowId) {
        throw new NotFoundError('Level');
      }

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.config !== undefined) updateData.config = data.config as any;

      await prisma.flowLevel.update({
        where: { id: levelId },
        data: updateData,
      });

      return this.getFlow(flowId) as Promise<IFlow>;
    } catch (error) {
      console.error('Error updating level:', error);
      throw error;
    }
  }

  // Delete level
  async deleteLevel(flowId: string, levelId: string): Promise<IFlow> {
    try {
      const flow = await prisma.flow.findUnique({
        where: { id: flowId },
      });

      if (!flow) {
        throw new NotFoundError('Flow');
      }

      if (flow.status === FlowStatus.PUBLISHED) {
        throw new ValidationError('Cannot modify levels of a published flow.', {});
      }

      const level = await prisma.flowLevel.findUnique({
        where: { id: levelId },
      });

      if (!level || level.flowId !== flowId) {
        throw new NotFoundError('Level');
      }

      // Delete level (cascade will handle related records)
      await prisma.flowLevel.delete({
        where: { id: levelId },
      });

      // Reorder remaining levels
      const remainingLevels = await prisma.flowLevel.findMany({
        where: { flowId },
        orderBy: { order: 'asc' },
      });

      for (let i = 0; i < remainingLevels.length; i++) {
        await prisma.flowLevel.update({
          where: { id: remainingLevels[i].id },
          data: { order: i + 1 },
        });
      }

      return this.getFlow(flowId) as Promise<IFlow>;
    } catch (error) {
      console.error('Error deleting level:', error);
      throw error;
    }
  }

  // Reorder levels
  async reorderLevels(flowId: string, levelIds: string[]): Promise<IFlow> {
    try {
      const flow = await prisma.flow.findUnique({
        where: { id: flowId },
        include: { levels: true },
      });

      if (!flow) {
        throw new NotFoundError('Flow');
      }

      if (flow.status === FlowStatus.PUBLISHED) {
        throw new ValidationError('Cannot modify levels of a published flow.', {});
      }

      // Validate all level IDs exist and belong to this flow
      const missingLevels: string[] = [];
      for (const levelId of levelIds) {
        const level = flow.levels.find((l) => l.id === levelId);
        if (!level) {
          missingLevels.push(levelId);
        }
      }
      
      if (missingLevels.length > 0) {
        console.error('Levels not found in flow:', {
          flowId,
          requestedLevelIds: levelIds,
          existingLevelIds: flow.levels.map(l => l.id),
          missingLevelIds: missingLevels,
        });
        throw new NotFoundError(`Level(s) not found: ${missingLevels.join(', ')}`);
      }
      
      // Validate that we have all levels (no extra levels, no missing levels)
      if (levelIds.length !== flow.levels.length) {
        console.error('Level count mismatch:', {
          flowId,
          requestedCount: levelIds.length,
          actualCount: flow.levels.length,
          requestedLevelIds: levelIds,
          existingLevelIds: flow.levels.map(l => l.id),
        });
        throw new ValidationError(
          `Level count mismatch. Requested ${levelIds.length} levels but flow has ${flow.levels.length} levels.`,
          { requestedCount: levelIds.length, actualCount: flow.levels.length }
        );
      }

      // Update order for each level in a transaction to ensure atomicity
      // IMPORTANT: Due to unique constraint on (flowId, order), we need to:
      // 1. First set all orders to temporary high values to avoid conflicts
      // 2. Then set them to their final values
      const tempOrderBase = 10000; // High enough to avoid conflicts
      
      await prisma.$transaction(async (tx) => {
        // Step 1: Set all levels to temporary high order values
        for (let i = 0; i < levelIds.length; i++) {
          await tx.flowLevel.update({
            where: { id: levelIds[i] },
            data: { order: tempOrderBase + i },
          });
        }
        
        // Step 2: Set all levels to their final order values
        for (let i = 0; i < levelIds.length; i++) {
          await tx.flowLevel.update({
            where: { id: levelIds[i] },
            data: { order: i + 1 },
          });
        }
      });

      console.log(`Reordered ${levelIds.length} levels for flow ${flowId}`);
      console.log('New order:', levelIds.map((id, index) => ({ id, order: index + 1 })));

      return this.getFlow(flowId) as Promise<IFlow>;
    } catch (error) {
      console.error('Error reordering levels:', error);
      throw error;
    }
  }

  // Add task to level
  async addTaskToLevel(flowId: string, levelId: string, data: IAddTaskToLevelRequest): Promise<IFlow> {
    try {
      const level = await prisma.flowLevel.findUnique({
        where: { id: levelId },
        include: { tasks: true },
      });

      if (!level || level.flowId !== flowId) {
        throw new NotFoundError('Level');
      }

      const flow = await prisma.flow.findUnique({
        where: { id: flowId },
      });

      if (flow?.status === FlowStatus.PUBLISHED) {
        throw new ValidationError('Cannot modify tasks of a published flow.', {});
      }

      // Determine order
      const maxOrder = level.tasks.length > 0 ? Math.max(...level.tasks.map((t) => t.order)) : -1;
      const order = data.order !== undefined ? data.order : maxOrder + 1;

      await prisma.flowLevelTask.create({
        data: {
          levelId,
          taskId: data.taskId,
          order,
          config: (data.config as any) || {},
        },
      });

      return this.getFlow(flowId) as Promise<IFlow>;
    } catch (error) {
      console.error('Error adding task to level:', error);
      throw error;
    }
  }

  // Remove task from level
  async removeTaskFromLevel(flowId: string, levelId: string, taskId: string): Promise<IFlow> {
    try {
      const level = await prisma.flowLevel.findUnique({
        where: { id: levelId },
      });

      if (!level || level.flowId !== flowId) {
        throw new NotFoundError('Level');
      }

      const flow = await prisma.flow.findUnique({
        where: { id: flowId },
      });

      if (flow?.status === FlowStatus.PUBLISHED) {
        throw new ValidationError('Cannot modify tasks of a published flow.', {});
      }

      await prisma.flowLevelTask.deleteMany({
        where: {
          levelId,
          taskId,
        },
      });

      return this.getFlow(flowId) as Promise<IFlow>;
    } catch (error) {
      console.error('Error removing task from level:', error);
      throw error;
    }
  }

  // Reorder tasks in level
  async reorderTasksInLevel(flowId: string, levelId: string, taskIds: string[]): Promise<IFlow> {
    try {
      const level = await prisma.flowLevel.findUnique({
        where: { id: levelId },
        include: { tasks: true },
      });

      if (!level || level.flowId !== flowId) {
        throw new NotFoundError('Level');
      }

      const flow = await prisma.flow.findUnique({
        where: { id: flowId },
      });

      if (flow?.status === FlowStatus.PUBLISHED) {
        throw new ValidationError('Cannot modify tasks of a published flow.', {});
      }

      // Validate all task IDs exist
      for (const taskId of taskIds) {
        const task = level.tasks.find((t) => t.taskId === taskId);
        if (!task) {
          throw new NotFoundError(`Task with ID ${taskId} in level`);
        }
      }

      // Update order for each task
      for (let i = 0; i < taskIds.length; i++) {
        await prisma.flowLevelTask.updateMany({
          where: {
            levelId,
            taskId: taskIds[i],
          },
          data: { order: i },
        });
      }

      return this.getFlow(flowId) as Promise<IFlow>;
    } catch (error) {
      console.error('Error reordering tasks in level:', error);
      throw error;
    }
  }

  // Add role to level
  async addRoleToLevel(flowId: string, levelId: string, roleId: string): Promise<IFlow> {
    try {
      const level = await prisma.flowLevel.findUnique({
        where: { id: levelId },
      });

      if (!level || level.flowId !== flowId) {
        throw new NotFoundError('Level');
      }

      // Check if role already assigned
      const existingRole = await prisma.role.findFirst({
        where: {
          id: roleId,
          flowLevels: {
            some: { id: levelId },
          },
        },
      });

      if (!existingRole) {
        // Connect role to level
        await prisma.flowLevel.update({
          where: { id: levelId },
          data: {
            roles: {
              connect: { id: roleId },
            },
          },
        });
      }

      return this.getFlow(flowId) as Promise<IFlow>;
    } catch (error) {
      console.error('Error adding role to level:', error);
      throw error;
    }
  }

  // Remove role from level
  async removeRoleFromLevel(flowId: string, levelId: string, roleId: string): Promise<IFlow> {
    try {
      const level = await prisma.flowLevel.findUnique({
        where: { id: levelId },
      });

      if (!level || level.flowId !== flowId) {
        throw new NotFoundError('Level');
      }

      await prisma.flowLevel.update({
        where: { id: levelId },
        data: {
          roles: {
            disconnect: { id: roleId },
          },
        },
      });

      return this.getFlow(flowId) as Promise<IFlow>;
    } catch (error) {
      console.error('Error removing role from level:', error);
      throw error;
    }
  }

  // Create branch
  async createBranch(flowId: string, data: ICreateFlowBranchRequest): Promise<IFlow> {
    try {
      const flow = await prisma.flow.findUnique({
        where: { id: flowId },
      });

      if (!flow) {
        throw new NotFoundError('Flow');
      }

      if (flow.status === FlowStatus.PUBLISHED) {
        throw new ValidationError('Cannot modify branches of a published flow.', {});
      }

      // Validate levels exist and belong to this flow
      const fromLevel = await prisma.flowLevel.findUnique({
        where: { id: data.fromLevelId },
      });

      const toLevel = await prisma.flowLevel.findUnique({
        where: { id: data.toLevelId },
      });

      if (!fromLevel || fromLevel.flowId !== flowId) {
        throw new NotFoundError('From level');
      }

      if (!toLevel || toLevel.flowId !== flowId) {
        throw new NotFoundError('To level');
      }

      await prisma.flowBranch.create({
        data: {
          name: data.name,
          fromLevelId: data.fromLevelId,
          toLevelId: data.toLevelId,
          conditions: data.conditions as any,
          priority: data.priority || 0,
          flowId,
        },
      });

      return this.getFlow(flowId) as Promise<IFlow>;
    } catch (error) {
      console.error('Error creating branch:', error);
      throw error;
    }
  }

  // Update branch
  async updateBranch(flowId: string, branchId: string, data: Partial<ICreateFlowBranchRequest>): Promise<IFlow> {
    try {
      const branch = await prisma.flowBranch.findUnique({
        where: { id: branchId },
      });

      if (!branch || branch.flowId !== flowId) {
        throw new NotFoundError('Branch');
      }

      const flow = await prisma.flow.findUnique({
        where: { id: flowId },
      });

      if (flow?.status === FlowStatus.PUBLISHED) {
        throw new ValidationError('Cannot modify branches of a published flow.', {});
      }

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.conditions !== undefined) updateData.conditions = data.conditions as any;
      if (data.priority !== undefined) updateData.priority = data.priority;

      await prisma.flowBranch.update({
        where: { id: branchId },
        data: updateData,
      });

      return this.getFlow(flowId) as Promise<IFlow>;
    } catch (error) {
      console.error('Error updating branch:', error);
      throw error;
    }
  }

  // Delete branch
  async deleteBranch(flowId: string, branchId: string): Promise<IFlow> {
    try {
      const branch = await prisma.flowBranch.findUnique({
        where: { id: branchId },
      });

      if (!branch || branch.flowId !== flowId) {
        throw new NotFoundError('Branch');
      }

      const flow = await prisma.flow.findUnique({
        where: { id: flowId },
      });

      if (flow?.status === FlowStatus.PUBLISHED) {
        throw new ValidationError('Cannot modify branches of a published flow.', {});
      }

      await prisma.flowBranch.delete({
        where: { id: branchId },
      });

      return this.getFlow(flowId) as Promise<IFlow>;
    } catch (error) {
      console.error('Error deleting branch:', error);
      throw error;
    }
  }

  // Publish flow
  async publishFlow(id: string): Promise<IFlow> {
    try {
      const flow = await prisma.flow.findUnique({
        where: { id },
      });

      if (!flow) {
        throw new NotFoundError('Flow');
      }

      if (flow.status === FlowStatus.PUBLISHED) {
        throw new ValidationError('Flow is already published.', {});
      }

      const updatedFlow = await prisma.flow.update({
        where: { id },
        data: {
          status: FlowStatus.PUBLISHED,
          publishedAt: new Date(),
        },
        include: {
          levels: {
            include: {
              tasks: {
                include: {
                  task: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
          branches: true,
        },
      });

      return this.mapFlowToIFlow(updatedFlow);
    } catch (error) {
      console.error('Error publishing flow:', error);
      throw error;
    }
  }

  // Delete flow (soft delete - archive)
  async deleteFlow(id: string): Promise<void> {
    try {
      const flow = await prisma.flow.findUnique({
        where: { id },
      });

      if (!flow) {
        throw new NotFoundError('Flow');
      }

      await prisma.flow.update({
        where: { id },
        data: { status: FlowStatus.ARCHIVED },
      });
    } catch (error) {
      console.error('Error deleting flow:', error);
      throw error;
    }
  }

  // Duplicate flow
  async duplicateFlow(id: string, newName: string): Promise<IFlow> {
    try {
      const originalFlow = await prisma.flow.findUnique({
        where: { id },
        include: {
          levels: {
            include: {
              tasks: true,
            },
            orderBy: { order: 'asc' },
          },
          branches: true,
        },
      });

      if (!originalFlow) {
        throw new NotFoundError('Flow');
      }

      // Increment version
      const versionParts = originalFlow.version.split('.');
      const majorVersion = parseInt(versionParts[0]) || 1;
      const newVersion = `${majorVersion + 1}.0`;

      // Create new flow
      const duplicatedFlow = await prisma.flow.create({
        data: {
          name: newName,
          description: originalFlow.description,
          version: newVersion,
          status: FlowStatus.DRAFT,
          config: originalFlow.config as any,
          companyId: originalFlow.companyId,
          createdById: originalFlow.createdById,
        },
      });

      // Copy levels
      for (const level of originalFlow.levels) {
        const newLevel = await prisma.flowLevel.create({
          data: {
            name: level.name,
            description: level.description,
            order: level.order,
            flowId: duplicatedFlow.id,
            config: level.config as any,
          },
        });

        // Copy tasks
        for (const task of level.tasks) {
          await prisma.flowLevelTask.create({
            data: {
              levelId: newLevel.id,
              taskId: task.taskId,
              order: task.order,
              config: task.config as any,
            },
          });
        }
      }

      // Copy branches (need to map old level IDs to new level IDs)
      const levelMap = new Map<string, string>();
      const originalLevels = await prisma.flowLevel.findMany({
        where: { flowId: originalFlow.id },
        orderBy: { order: 'asc' },
      });
      const newLevels = await prisma.flowLevel.findMany({
        where: { flowId: duplicatedFlow.id },
        orderBy: { order: 'asc' },
      });

      for (let i = 0; i < originalLevels.length; i++) {
        levelMap.set(originalLevels[i].id, newLevels[i].id);
      }

      for (const branch of originalFlow.branches) {
        const newFromLevelId = levelMap.get(branch.fromLevelId);
        const newToLevelId = levelMap.get(branch.toLevelId);

        if (newFromLevelId && newToLevelId) {
          await prisma.flowBranch.create({
            data: {
              name: branch.name,
              fromLevelId: newFromLevelId,
              toLevelId: newToLevelId,
              conditions: branch.conditions as any,
              priority: branch.priority,
              flowId: duplicatedFlow.id,
            },
          });
        }
      }

      return this.getFlow(duplicatedFlow.id) as Promise<IFlow>;
    } catch (error) {
      console.error('Error duplicating flow:', error);
      throw error;
    }
  }

  // Helper method to map Prisma Flow to IFlow
  private mapFlowToIFlow(flow: any): IFlow {
    return {
      id: flow.id,
      name: flow.name,
      description: flow.description || undefined,
      version: flow.version,
      status: flow.status as IFlow['status'],
      config: (flow.config as any) || {},
      companyId: flow.companyId,
      createdById: flow.createdById,
      levels: (flow.levels || []).map((level: any) => ({
        id: level.id,
        name: level.name,
        description: level.description || undefined,
        order: level.order,
        flowId: level.flowId,
        config: (level.config as any) || {},
        tasks: (level.tasks || []).map((task: any) => ({
          id: task.id,
          levelId: task.levelId,
          taskId: task.taskId,
          order: task.order,
          config: (task.config as any) || {},
          createdAt: task.createdAt,
        })),
        roles: (level.roles || []).map((role: any) => role.id),
        createdAt: level.createdAt,
        updatedAt: level.updatedAt,
      })),
      branches: (flow.branches || []).map((branch: any) => ({
        id: branch.id,
        name: branch.name,
        fromLevelId: branch.fromLevelId,
        toLevelId: branch.toLevelId,
        conditions: (branch.conditions as any) || {},
        priority: branch.priority,
        flowId: branch.flowId,
        createdAt: branch.createdAt,
        updatedAt: branch.updatedAt,
      })),
      createdAt: flow.createdAt,
      updatedAt: flow.updatedAt,
      publishedAt: flow.publishedAt || undefined,
    };
  }
}

export const flowService = new FlowService();

