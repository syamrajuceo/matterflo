import { Router } from 'express';
import { taskController } from './task.controller';
import { authenticateToken } from '../auth/auth.middleware';
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
router.post('/', validate(createTaskSchema), taskController.createTask);
router.get('/', taskController.listTasks);
router.get('/:id', taskController.getTask);
router.put('/:id', validate(updateTaskSchema), taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// Field operations
router.post('/:id/fields', taskController.addField);
router.put('/:id/fields/:fieldId', taskController.updateField);
router.delete('/:id/fields/:fieldId', taskController.deleteField);
router.put('/:id/fields/reorder', taskController.reorderFields);

// Task actions
router.post('/:id/publish', taskController.publishTask);
router.post('/:id/duplicate', validate(duplicateTaskSchema), taskController.duplicateTask);

export default router;

