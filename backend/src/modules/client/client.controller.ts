import { Request, Response, NextFunction } from 'express';
import { clientService } from './client.service';
import { successResponse } from '../../common/utils/response';

class ClientController {
  // GET /api/client/dashboard
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const stats = await clientService.getDashboardStats(userId);
      res.json(successResponse(stats));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/client/tasks
  async getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const tasks = await clientService.getPendingTasksForUser(userId);
      res.json(successResponse(tasks));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/client/tasks/pending
  async getPendingTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      console.log('Getting pending tasks for user:', userId);
      const pending = await clientService.getPendingTasksForUser(userId);
      console.log('Pending tasks result:', pending);
      res.json(successResponse(pending));
    } catch (error) {
      console.error('Error in getPendingTasks controller:', error);
      next(error);
    }
  }

  // GET /api/client/tasks/:id
  async getTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const task = await clientService.getTaskExecutionForUser(id, userId);
      res.json(successResponse(task));
    } catch (error) {
      next(error);
    }
  }

  // POST /api/client/tasks/:id/submit
  async submitTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { data } = req.body as { data?: Record<string, any> };

      await clientService.completeTask(id, userId, { data: data || {} });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // POST /api/client/tasks/:id/complete
  async completeTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { data } = req.body as { data?: Record<string, any> };

      await clientService.completeTask(id, userId, { data: data || {} });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // GET /api/client/flows
  async getFlows(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const flows = await clientService.getMyFlowInstances(userId);
      res.json(successResponse({ flows }));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/client/flows/:id
  async getFlowInstance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const instance = await clientService.getFlowInstanceForUser(id, userId);
      res.json(successResponse(instance));
    } catch (error) {
      next(error);
    }
  }
}

export const clientController = new ClientController();


