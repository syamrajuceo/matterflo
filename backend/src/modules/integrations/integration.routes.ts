import { Router } from 'express';
import { authenticateToken } from '../auth/auth.middleware';
import { requireDeveloper } from '../../common/middleware/authorization.middleware';
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
// CREATE/DELETE - Only developers
router.post('/', requireDeveloper, validate(createIntegrationSchema), integrationController.createIntegration);
router.delete('/:id', requireDeveloper, integrationController.deleteIntegration);

// READ - All authenticated users
router.get('/', integrationController.listIntegrations);
router.get('/:id', integrationController.getIntegration);

// Workflows - Only developers
router.post('/:id/workflows', requireDeveloper, validate(createWorkflowSchema), integrationController.createWorkflow);
router.post('/:id/workflows/:workflowId/test', requireDeveloper, integrationController.testWorkflow);

export default router;


