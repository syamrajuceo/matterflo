import { Router } from 'express';
import { triggerController } from './trigger.controller';
import { authenticateToken } from '../auth/auth.middleware';
import { requireDeveloper } from '../../common/middleware/authorization.middleware';
import { validate } from '../../common/middleware/validation.middleware';
import {
  createTriggerSchema,
  updateTriggerSchema,
  testTriggerSchema,
} from './trigger.validation';

const router = Router();

// All trigger routes require authentication
router.use(authenticateToken);

// Trigger CRUD operations
// CREATE/UPDATE/DELETE - Only developers
router.post('/', requireDeveloper, validate(createTriggerSchema), triggerController.createTrigger);
router.put('/:id', requireDeveloper, validate(updateTriggerSchema), triggerController.updateTrigger);
router.delete('/:id', requireDeveloper, triggerController.deleteTrigger);

// READ - All authenticated users
router.get('/', triggerController.listTriggers);
router.get('/:id', triggerController.getTrigger);

// Trigger actions - Only developers
router.post('/:id/test', requireDeveloper, validate(testTriggerSchema), triggerController.testTrigger);
router.get('/:id/executions', requireDeveloper, triggerController.getTriggerExecutions);

export default router;

