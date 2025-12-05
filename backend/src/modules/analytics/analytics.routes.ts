import { Router } from 'express';
import { authenticateToken } from '../auth/auth.middleware';
import { analyticsController } from './analytics.controller';

const router = Router();

// All analytics routes require authentication
router.use(authenticateToken);

// Analytics endpoints
router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/tasks', analyticsController.getTaskAnalytics);
router.get('/flows', analyticsController.getFlowAnalytics);
router.get('/users', analyticsController.getUserActivityAnalytics);
router.get('/company', analyticsController.getCompanyAnalytics);
router.get('/performance', analyticsController.getPerformanceMetrics);

export default router;

