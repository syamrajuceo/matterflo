import { Request, Response, NextFunction } from 'express';
import { flowService } from './flow.service';
import { successResponse } from '../../common/utils/response';

class FlowController {
  // POST /api/flows
  createFlow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description } = req.body;
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_ERROR', message: 'Not authenticated' },
        });
      }

      const companyId = req.user.companyId;
      const createdById = req.user.id;

      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'User must be associated with a company. Please contact your administrator to assign you to a company.' 
          },
        });
      }

      const flow = await flowService.createFlow({
        name,
        description,
        companyId,
        createdById,
      });

      res.status(201).json(successResponse(flow));
    } catch (error) {
      next(error);
    }
  };

  // GET /api/flows/:id
  getFlow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const flow = await flowService.getFlow(id);

      if (!flow) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Flow not found' },
        });
      }

      res.json(successResponse(flow));
    } catch (error) {
      next(error);
    }
  };

  // GET /api/flows
  listFlows = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, search, page, limit } = req.query;
      const companyId = req.user!.companyId!;

      const filters = {
        companyId,
        status: status as any,
        search: search as string | undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      };

      const result = await flowService.listFlows(filters);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/flows/:id
  updateFlow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const flow = await flowService.updateFlow(id, req.body);
      res.json(successResponse(flow));
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/flows/:id
  deleteFlow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await flowService.deleteFlow(id);
      res.json(successResponse(null, 'Flow deleted successfully'));
    } catch (error) {
      next(error);
    }
  };

  // POST /api/flows/:id/publish
  publishFlow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const flow = await flowService.publishFlow(id);
      res.json(successResponse(flow));
    } catch (error) {
      next(error);
    }
  };

  // POST /api/flows/:id/duplicate
  duplicateFlow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const flow = await flowService.duplicateFlow(id, name);
      res.json(successResponse(flow));
    } catch (error) {
      next(error);
    }
  };

  // POST /api/flows/:id/levels
  addLevel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const flow = await flowService.addLevel(id, req.body);
      res.json(successResponse(flow));
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/flows/:id/levels/:levelId
  updateLevel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, levelId } = req.params;
      const flow = await flowService.updateLevel(id, levelId, req.body);
      res.json(successResponse(flow));
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/flows/:id/levels/:levelId
  deleteLevel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, levelId } = req.params;
      const flow = await flowService.deleteLevel(id, levelId);
      res.json(successResponse(flow));
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/flows/:id/levels/reorder
  reorderLevels = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { levelIds } = req.body;
      const flow = await flowService.reorderLevels(id, levelIds);
      res.json(successResponse(flow));
    } catch (error) {
      next(error);
    }
  };

  // POST /api/flows/:id/levels/:levelId/tasks
  addTaskToLevel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, levelId } = req.params;
      const flow = await flowService.addTaskToLevel(id, levelId, req.body);
      res.json(successResponse(flow));
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/flows/:id/levels/:levelId/tasks/:taskId
  removeTaskFromLevel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, levelId, taskId } = req.params;
      const flow = await flowService.removeTaskFromLevel(id, levelId, taskId);
      res.json(successResponse(flow));
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/flows/:id/levels/:levelId/tasks/reorder
  reorderTasksInLevel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, levelId } = req.params;
      const { taskIds } = req.body;
      const flow = await flowService.reorderTasksInLevel(id, levelId, taskIds);
      res.json(successResponse(flow));
    } catch (error) {
      next(error);
    }
  };

  // POST /api/flows/:id/levels/:levelId/roles
  addRoleToLevel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, levelId } = req.params;
      const { roleId } = req.body;
      const flow = await flowService.addRoleToLevel(id, levelId, roleId);
      res.json(successResponse(flow));
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/flows/:id/levels/:levelId/roles/:roleId
  removeRoleFromLevel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, levelId, roleId } = req.params;
      const flow = await flowService.removeRoleFromLevel(id, levelId, roleId);
      res.json(successResponse(flow));
    } catch (error) {
      next(error);
    }
  };

  // POST /api/flows/:id/branches
  createBranch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const flow = await flowService.createBranch(id, req.body);
      res.json(successResponse(flow));
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/flows/:id/branches/:branchId
  updateBranch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, branchId } = req.params;
      const flow = await flowService.updateBranch(id, branchId, req.body);
      res.json(successResponse(flow));
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/flows/:id/branches/:branchId
  deleteBranch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, branchId } = req.params;
      const flow = await flowService.deleteBranch(id, branchId);
      res.json(successResponse(flow));
    } catch (error) {
      next(error);
    }
  };
}

export const flowController = new FlowController();

