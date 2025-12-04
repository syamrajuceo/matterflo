import { Request, Response, NextFunction } from 'express';
import { integrationService } from './integration.service';
import { webhookConnector } from './connectors/webhook.connector';
import { successResponse } from '../../common/utils/response';

class IntegrationController {
  // POST /api/integrations
  createIntegration = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user || !user.companyId) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_ERROR', message: 'User must be associated with a company' },
        });
      }

      const baseUrl =
        process.env.PUBLIC_API_URL ||
        `${req.protocol}://${req.get('host') || 'localhost:3000'}`;

      const integration = await integrationService.createIntegration({
        name: req.body.name,
        type: req.body.type,
        config: req.body.config || {},
        companyId: user.companyId,
        baseUrl,
      });

      res.status(201).json(successResponse(integration));
    } catch (error) {
      next(error);
    }
  };

  // GET /api/integrations
  listIntegrations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user || !user.companyId) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_ERROR', message: 'User must be associated with a company' },
        });
      }

      const integrations = await integrationService.listIntegrations(user.companyId);
      res.json(successResponse(integrations));
    } catch (error) {
      next(error);
    }
  };

  // GET /api/integrations/:id
  getIntegration = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const integration = await integrationService.getIntegration(id);

      if (!integration) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Integration not found' },
        });
      }

      res.json(successResponse(integration));
    } catch (error) {
      next(error);
    }
  };

  // POST /api/integrations/:id/workflows
  createWorkflow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const workflow = await integrationService.createWorkflow(id, req.body);
      res.status(201).json(successResponse(workflow));
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/integrations/:id
  deleteIntegration = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await integrationService.deleteIntegration(id);
      res.json(successResponse({ message: 'Integration deleted successfully' }));
    } catch (error) {
      next(error);
    }
  };

  // POST /api/integrations/webhooks/:webhookId
  handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { webhookId } = req.params;
      const payload = req.body;

      await webhookConnector.handleWebhook(webhookId, payload);

      res.json(successResponse({ received: true }));
    } catch (error) {
      next(error);
    }
  };

  // POST /api/integrations/:id/workflows/:workflowId/test
  testWorkflow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, workflowId } = req.params;
      const testData = req.body;
      const result = await integrationService.testWorkflow(id, workflowId, testData);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };
}

export const integrationController = new IntegrationController();


