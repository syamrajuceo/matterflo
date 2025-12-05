import { Router } from 'express';
import { versionController } from './version.controller';
import { authenticateToken } from '../auth/auth.middleware';
import { requireDeveloper } from '../../common/middleware/authorization.middleware';

const router = Router();

// All version routes require authentication and developer role
router.use(authenticateToken);
router.use(requireDeveloper);

// Version operations
router.post('/', versionController.createVersion);
router.get('/:entityType/:entityId', versionController.getVersionHistory);
router.post('/:id/publish', versionController.publishVersion);
router.post('/:id/rollback', versionController.rollbackVersion);

// Staged rollout operations
router.put('/:id/rollout', versionController.updateRollout);
router.get('/:id/rollout', versionController.getRolloutStatus);
router.post('/:id/rollout/progress', versionController.progressRollout);

export default router;

