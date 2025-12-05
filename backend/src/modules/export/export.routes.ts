import { Router } from 'express';
import { exportController } from './export.controller';
import { authenticateToken } from '../auth/auth.middleware';
import { requireDeveloper } from '../../common/middleware/authorization.middleware';

const router = Router();

// All export routes require authentication and developer role
router.use(authenticateToken);
router.use(requireDeveloper);

// Export operations
router.get('/:companyId', exportController.exportCompany);
router.get('/:companyId/download', exportController.downloadExport);

export default router;

