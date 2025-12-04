import { Request, Response, NextFunction } from 'express';
import { executionService } from './execution.service';
import { successResponse } from '../../common/utils/response';

class ExecutionController {
  // POST /api/executions/tasks
  async createTaskExecution(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { taskId, executorId, flowInstanceId, levelId, initialData } = req.body;
      const execution = await executionService.createTaskExecution({
        taskId,
        executorId,
        flowInstanceId,
        levelId,
        initialData,
      });
      res.json(successResponse(execution));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/executions/tasks/:id
  async getTaskExecution(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const execution = await executionService.getTaskExecution(id, userId);
      res.json(successResponse(execution));
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/executions/tasks/:id
  async updateTaskExecution(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { data, status } = req.body;
      const execution = await executionService.updateTaskExecution(id, userId, { data, status });
      res.json(successResponse(execution));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/executions/tasks/my-tasks
  async getMyTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { status } = req.query;
      const executions = await executionService.listTaskExecutionsForUser(
        userId,
        status as any
      );
      res.json(successResponse({ tasks: executions }));
    } catch (error) {
      next(error);
    }
  }

  // POST /api/executions/flows
  async createFlowInstance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { flowId, contextData } = req.body;
      const initiatorId = req.user!.id;
      const instance = await executionService.createFlowInstance({
        flowId,
        initiatorId,
        contextData,
      });
      res.json(successResponse(instance));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/executions/flows/:id
  async getFlowInstance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const instance = await executionService.getFlowInstance(id, userId);
      res.json(successResponse(instance));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/executions/flows/my-flows
  async getMyFlows(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const instances = await executionService.listFlowInstancesForUser(userId);
      res.json(successResponse({ flows: instances }));
    } catch (error) {
      next(error);
    }
  }
}

export const executionController = new ExecutionController();

