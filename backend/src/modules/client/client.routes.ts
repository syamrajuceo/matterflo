import { Router } from 'express';
import { authenticateToken } from '../auth/auth.middleware';
import { clientController } from './client.controller';

const router = Router();

// All client routes require authentication (client user)
router.use(authenticateToken);

router.get('/dashboard', (req, res, next) =>
  clientController.getDashboard(req, res, next)
);

router.get('/tasks', (req, res, next) => clientController.getTasks(req, res, next));

router.get('/tasks/pending', (req, res, next) =>
  clientController.getPendingTasks(req, res, next)
);

router.get('/tasks/:id', (req, res, next) => clientController.getTask(req, res, next));

router.post('/tasks/:id/submit', (req, res, next) =>
  clientController.submitTask(req, res, next)
);

router.post('/tasks/:id/complete', (req, res, next) =>
  clientController.completeTask(req, res, next)
);

router.get('/flows', (req, res, next) => clientController.getFlows(req, res, next));

router.get('/flows/:id', (req, res, next) =>
  clientController.getFlowInstance(req, res, next)
);

export default router;


