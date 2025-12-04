import { Router } from 'express';
import { flowController } from './flow.controller';
import { authenticateToken } from '../auth/auth.middleware';
import { validate } from '../../common/middleware/validation.middleware';
import {
  createFlowSchema,
  updateFlowSchema,
  createFlowLevelSchema,
  updateFlowLevelSchema,
  reorderLevelsSchema,
  createFlowBranchSchema,
  updateFlowBranchSchema,
  addTaskToLevelSchema,
  reorderTasksInLevelSchema,
  addRoleToLevelSchema,
  duplicateFlowSchema,
} from './flow.validation';

const router = Router();

// All flow routes require authentication
router.use(authenticateToken);

// Flow CRUD operations
router.post('/', validate(createFlowSchema), flowController.createFlow);
router.get('/', flowController.listFlows);
router.get('/:id', flowController.getFlow);
router.put('/:id', validate(updateFlowSchema), flowController.updateFlow);
router.delete('/:id', flowController.deleteFlow);

// Flow actions
router.post('/:id/publish', flowController.publishFlow);
router.post('/:id/duplicate', validate(duplicateFlowSchema), flowController.duplicateFlow);

// Level operations
// IMPORTANT: More specific routes must come before parameterized routes
// Otherwise Express will match "reorder" as a :levelId parameter
router.post('/:id/levels', validate(createFlowLevelSchema), flowController.addLevel);
router.put('/:id/levels/reorder', validate(reorderLevelsSchema), flowController.reorderLevels);
router.put('/:id/levels/:levelId', validate(updateFlowLevelSchema), flowController.updateLevel);
router.delete('/:id/levels/:levelId', flowController.deleteLevel);

// Task assignment to level
router.post('/:id/levels/:levelId/tasks', validate(addTaskToLevelSchema), flowController.addTaskToLevel);
router.delete('/:id/levels/:levelId/tasks/:taskId', flowController.removeTaskFromLevel);
router.put('/:id/levels/:levelId/tasks/reorder', validate(reorderTasksInLevelSchema), flowController.reorderTasksInLevel);

// Role assignment to level
router.post('/:id/levels/:levelId/roles', validate(addRoleToLevelSchema), flowController.addRoleToLevel);
router.delete('/:id/levels/:levelId/roles/:roleId', flowController.removeRoleFromLevel);

// Branch operations
router.post('/:id/branches', validate(createFlowBranchSchema), flowController.createBranch);
router.put('/:id/branches/:branchId', validate(updateFlowBranchSchema), flowController.updateBranch);
router.delete('/:id/branches/:branchId', flowController.deleteBranch);

export default router;

