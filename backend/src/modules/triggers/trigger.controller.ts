import { Request, Response, NextFunction } from 'express';
import { triggerService } from './trigger.service';
import { successResponse } from '../../common/utils/response';

class TriggerController {
  // POST /api/triggers
  createTrigger = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const trigger = await triggerService.createTrigger(req.body);
      res.status(201).json(successResponse(trigger));
    } catch (error) {
      next(error);
    }
  };

  // GET /api/triggers/:id
  getTrigger = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const trigger = await triggerService.getTrigger(id);

      if (!trigger) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Trigger not found' },
        });
      }

      res.json(successResponse(trigger));
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/triggers/:id
  updateTrigger = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const trigger = await triggerService.updateTrigger(id, req.body);
      res.json(successResponse(trigger));
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/triggers/:id
  deleteTrigger = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await triggerService.deleteTrigger(id);
      res.json(successResponse(null, 'Trigger deleted successfully'));
    } catch (error) {
      next(error);
    }
  };

  // GET /api/triggers
  listTriggers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        taskId: req.query.taskId as string | undefined,
        flowId: req.query.flowId as string | undefined,
        eventType: req.query.eventType as any,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const result = await triggerService.listTriggers(filters);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  // POST /api/triggers/:id/test
  testTrigger = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      // Accept both 'sampleData' and 'eventData' for compatibility
      const sampleData = req.body.sampleData || req.body.eventData || req.body;
      const result = await triggerService.testTrigger(id, sampleData);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  // GET /api/triggers/:id/executions
  getTriggerExecutions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const result = await triggerService.getTriggerExecutions(id, page, limit);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };
}

export const triggerController = new TriggerController();

