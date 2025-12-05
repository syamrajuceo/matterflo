import { Request, Response, NextFunction } from 'express';
import { taskService } from './task.service';
import { successResponse } from '../../common/utils/response';
import { getCompanyIdForUser } from '../../common/utils/company-helper';

class TaskController {
  // POST /api/tasks
  createTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description } = req.body;
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        });
      }

      // Use helper to get companyId (handles DEVELOPER users with x-company-id header)
      let companyId = await getCompanyIdForUser(req.user, req);
      const createdById = req.user.id;

      console.log('[TaskController] createTask - User:', {
        userId: req.user.id,
        role: req.user.role,
        userCompanyId: req.user.companyId,
        resolvedCompanyId: companyId,
        xCompanyIdHeader: req.headers['x-company-id'],
      });

      // If user doesn't have a company (and helper didn't find one), create one automatically
      if (!companyId) {
        console.log('[TaskController] createTask - No companyId found, creating one automatically');
        const { prisma } = await import('../../common/config/database.config');
        const emailDomain = req.user.email.split('@')[1];
        const companyDomain = `${emailDomain.split('.')[0]}.local`;
        
        let company = await prisma.company.findFirst({
          where: { domain: companyDomain },
        });

        if (!company) {
          company = await prisma.company.create({
            data: {
              name: `${req.user.firstName || 'User'}'s Company`,
              domain: companyDomain,
              isActive: true,
            },
          });
        }

        // Update user with companyId (only if not DEVELOPER, as DEVELOPER users don't have companyId)
        if (req.user.role !== 'DEVELOPER') {
          await prisma.user.update({
            where: { id: req.user.id },
            data: { companyId: company.id },
          });
        }

        companyId = company.id;
      }

      const task = await taskService.createTask({
        name,
        description,
        companyId,
        createdById
      });

      res.status(201).json(successResponse(task));
    } catch (error) {
      next(error);
    }
  };

  // GET /api/tasks/:id
  getTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const task = await taskService.getTask(id);

      if (!task) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Task not found' }
        });
      }

      res.json(successResponse(task));
    } catch (error) {
      next(error);
    }
  };

  // GET /api/tasks
  listTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, search, page = '1', limit = '20' } = req.query;
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        });
      }

      // Use helper to get companyId (handles DEVELOPER users with x-company-id header)
      const companyId = await getCompanyIdForUser(req.user, req);
      
      console.log('[TaskController] listTasks - User:', {
        userId: req.user.id,
        role: req.user.role,
        userCompanyId: req.user.companyId,
        resolvedCompanyId: companyId,
        xCompanyIdHeader: req.headers['x-company-id'],
      });
      
      if (!companyId) {
        console.log('[TaskController] listTasks - No companyId found, returning empty result');
        // Return empty result if user has no company
        return res.json(successResponse({
          tasks: [],
          total: 0,
          page: parseInt(page as string),
          totalPages: 0
        }));
      }

      const result = await taskService.listTasks({
        companyId,
        status: status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DEPRECATED' | undefined,
        search: search as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      console.log('[TaskController] listTasks - Found tasks:', result.tasks.length, 'for company:', companyId);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/tasks/:id
  updateTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const task = await taskService.updateTask(id, req.body);

      res.json(successResponse(task));
    } catch (error) {
      next(error);
    }
  };

  // POST /api/tasks/:id/fields
  addField = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const task = await taskService.addField(id, req.body);

      res.json(successResponse(task));
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/tasks/:id/fields/:fieldId
  updateField = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, fieldId } = req.params;
      const task = await taskService.updateField(id, fieldId, req.body);

      res.json(successResponse(task));
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/tasks/:id/fields/:fieldId
  deleteField = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, fieldId } = req.params;
      const task = await taskService.deleteField(id, fieldId);

      res.json(successResponse(task));
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/tasks/:id/fields/reorder
  reorderFields = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { fieldIds } = req.body;
      const task = await taskService.reorderFields(id, fieldIds);

      res.json(successResponse(task));
    } catch (error) {
      next(error);
    }
  };

  // POST /api/tasks/:id/publish
  publishTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const task = await taskService.publishTask(id);

      res.json(successResponse(task));
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/tasks/:id
  deleteTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        });
      }

      // Verify the task exists and belongs to the user's company context
      const task = await taskService.getTask(id);
      if (!task) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Task not found' }
        });
      }

      // Use helper to get companyId (handles DEVELOPER users with x-company-id header)
      const companyId = await getCompanyIdForUser(req.user, req);
      
      console.log('[TaskController] deleteTask - User:', {
        userId: req.user.id,
        role: req.user.role,
        userCompanyId: req.user.companyId,
        resolvedCompanyId: companyId,
        taskCompanyId: task.companyId,
        xCompanyIdHeader: req.headers['x-company-id'],
      });

      // Verify task belongs to the user's company context
      if (companyId && task.companyId !== companyId) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You do not have permission to delete this task' }
        });
      }

      await taskService.deleteTask(id);

      res.json(successResponse(null));
    } catch (error) {
      next(error);
    }
  };

  // POST /api/tasks/:id/duplicate
  duplicateTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const task = await taskService.duplicateTask(id, name);

      res.json(successResponse(task));
    } catch (error) {
      next(error);
    }
  };
}

export const taskController = new TaskController();

