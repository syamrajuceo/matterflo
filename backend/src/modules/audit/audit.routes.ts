import { Router } from 'express';
import { authenticateToken } from '../auth/auth.middleware';
import { auditController } from './audit.controller';

const router = Router();

// All audit routes require authentication
router.use(authenticateToken);

// Get audit logs with filters + pagination
router.get('/logs', (req, res, next) => auditController.getLogs(req, res, next));

// Export audit logs as CSV
router.get('/logs/export', (req, res, next) => auditController.exportLogs(req, res, next));

// Create test audit logs (for testing purposes)
router.post('/logs/test', (req, res, next) => auditController.createTestLogs(req, res, next));

export default router;


