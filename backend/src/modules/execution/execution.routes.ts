import { Router } from 'express';
import { authenticateToken } from '../auth/auth.middleware';
import { executionController } from './execution.controller';

const router = Router();

// All execution routes require authentication
router.use(authenticateToken);

// Task Execution routes
router.post('/tasks', (req, res, next) => executionController.createTaskExecution(req, res, next));
router.get('/tasks/my-tasks', (req, res, next) => executionController.getMyTasks(req, res, next));
router.get('/tasks/:id', (req, res, next) => executionController.getTaskExecution(req, res, next));
router.put('/tasks/:id', (req, res, next) => executionController.updateTaskExecution(req, res, next));

// Flow Instance routes
router.post('/flows', (req, res, next) => executionController.createFlowInstance(req, res, next));
router.get('/flows/my-flows', (req, res, next) => executionController.getMyFlows(req, res, next));
router.get('/flows/:id', (req, res, next) => executionController.getFlowInstance(req, res, next));

export default router;

