import { Router } from 'express';
import { flowController } from './flow.controller';
import { authenticateToken } from '../auth/auth.middleware';
import { requireDeveloper, canEditFlow } from '../../common/middleware/authorization.middleware';
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
// CREATE/DELETE - Only developers
router.post('/', requireDeveloper, validate(createFlowSchema), flowController.createFlow);
router.delete('/:id', requireDeveloper, flowController.deleteFlow);

// UPDATE - Developers can do everything, clients can do limited edits
router.put('/:id', requireDeveloper, validate(updateFlowSchema), flowController.updateFlow);

// READ - All authenticated users
router.get('/', flowController.listFlows);
router.get('/:id', flowController.getFlow);

// Flow actions - Only developers
router.post('/:id/publish', requireDeveloper, flowController.publishFlow);
router.post('/:id/duplicate', requireDeveloper, validate(duplicateFlowSchema), flowController.duplicateFlow);

// Level operations
// IMPORTANT: More specific routes must come before parameterized routes
// Otherwise Express will match "reorder" as a :levelId parameter
// CREATE/DELETE/REORDER - Only developers
router.post('/:id/levels', canEditFlow(true), validate(createFlowLevelSchema), flowController.addLevel);
router.put('/:id/levels/reorder', requireDeveloper, validate(reorderLevelsSchema), flowController.reorderLevels);
router.put('/:id/levels/:levelId', canEditFlow(true), validate(updateFlowLevelSchema), flowController.updateLevel);
router.delete('/:id/levels/:levelId', requireDeveloper, flowController.deleteLevel);

// Task assignment to level - Clients can change assignments
router.post('/:id/levels/:levelId/tasks', canEditFlow(true), validate(addTaskToLevelSchema), flowController.addTaskToLevel);
router.delete('/:id/levels/:levelId/tasks/:taskId', canEditFlow(true), flowController.removeTaskFromLevel);
router.put('/:id/levels/:levelId/tasks/reorder', canEditFlow(true), validate(reorderTasksInLevelSchema), flowController.reorderTasksInLevel);

// Role assignment to level - Clients can change assignments
router.post('/:id/levels/:levelId/roles', canEditFlow(true), validate(addRoleToLevelSchema), flowController.addRoleToLevel);
router.delete('/:id/levels/:levelId/roles/:roleId', canEditFlow(true), flowController.removeRoleFromLevel);

// Branch operations - Only developers
router.post('/:id/branches', requireDeveloper, validate(createFlowBranchSchema), flowController.createBranch);
router.put('/:id/branches/:branchId', requireDeveloper, validate(updateFlowBranchSchema), flowController.updateBranch);
router.delete('/:id/branches/:branchId', requireDeveloper, flowController.deleteBranch);

export default router;

