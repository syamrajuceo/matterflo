import { Router } from 'express';
import { triggerController } from './trigger.controller';
import { authenticateToken } from '../auth/auth.middleware';
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
router.post('/', validate(createTriggerSchema), triggerController.createTrigger);
router.get('/', triggerController.listTriggers);
router.get('/:id', triggerController.getTrigger);
router.put('/:id', validate(updateTriggerSchema), triggerController.updateTrigger);
router.delete('/:id', triggerController.deleteTrigger);

// Trigger actions
router.post('/:id/test', validate(testTriggerSchema), triggerController.testTrigger);
router.get('/:id/executions', triggerController.getTriggerExecutions);

export default router;

