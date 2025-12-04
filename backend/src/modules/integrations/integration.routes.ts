import { Router } from 'express';
import { authenticateToken } from '../auth/auth.middleware';
import { validate } from '../../common/middleware/validation.middleware';
import { integrationController } from './integration.controller';
import { createIntegrationSchema, createWorkflowSchema } from './integration.validation';

const router = Router();

// All integration routes (except incoming webhooks) require authentication
router.use('/webhooks/:webhookId', (req, res, next) => next()); // allow unauthenticated webhooks
router.use(authenticateToken);

// Incoming webhooks (no auth) - must be before other routes to avoid conflicts
router.post('/webhooks/:webhookId', integrationController.handleWebhook);

// Integration CRUD
router.post('/', validate(createIntegrationSchema), integrationController.createIntegration);
router.get('/', integrationController.listIntegrations);
router.get('/:id', integrationController.getIntegration);
router.delete('/:id', integrationController.deleteIntegration);

// Workflows
router.post('/:id/workflows', validate(createWorkflowSchema), integrationController.createWorkflow);
router.post('/:id/workflows/:workflowId/test', integrationController.testWorkflow);

export default router;


