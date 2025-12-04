import { Request, Response, NextFunction } from 'express';
import { taskService } from './task.service';
import { successResponse } from '../../common/utils/response';

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

      let companyId = req.user.companyId;
      const createdById = req.user.id;

      // If user doesn't have a company, create one automatically
      if (!companyId) {
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

        // Update user with companyId
        await prisma.user.update({
          where: { id: req.user.id },
          data: { companyId: company.id },
        });

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

      const companyId = req.user.companyId;
      
      if (!companyId) {
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

