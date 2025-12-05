import { Router } from 'express';
import { taskController } from './task.controller';
import { authenticateToken } from '../auth/auth.middleware';
import { requireDeveloper } from '../../common/middleware/authorization.middleware';
import { validate } from '../../common/middleware/validation.middleware';
import {
  createTaskSchema,
  updateTaskSchema,
  addFieldSchema,
  updateFieldSchema,
  reorderFieldsSchema,
  duplicateTaskSchema,
} from './task.validation';

const router = Router();

// All task routes require authentication
router.use(authenticateToken);

// Task CRUD operations
// CREATE/UPDATE/DELETE - Only developers
router.post('/', requireDeveloper, validate(createTaskSchema), taskController.createTask);
router.put('/:id', requireDeveloper, validate(updateTaskSchema), taskController.updateTask);
router.delete('/:id', requireDeveloper, taskController.deleteTask);

// READ - All authenticated users
router.get('/', taskController.listTasks);
router.get('/:id', taskController.getTask);

// Field operations - Only developers
router.post('/:id/fields', requireDeveloper, taskController.addField);
router.put('/:id/fields/:fieldId', requireDeveloper, taskController.updateField);
router.delete('/:id/fields/:fieldId', requireDeveloper, taskController.deleteField);
router.put('/:id/fields/reorder', requireDeveloper, validate(reorderFieldsSchema), taskController.reorderFields);

// Task actions - Only developers
router.post('/:id/publish', requireDeveloper, taskController.publishTask);
router.post('/:id/duplicate', requireDeveloper, validate(duplicateTaskSchema), taskController.duplicateTask);

export default router;

