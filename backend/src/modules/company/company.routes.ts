import { Router } from 'express';
import { authenticateToken, requireRole } from '../auth/auth.middleware';
import { validate } from '../../common/middleware/validation.middleware';
import { companyController } from './company.controller';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  moveDepartmentSchema,
  createRoleSchema,
  updateRoleSchema,
} from './company.validation';

const router = Router();

// All company routes require authentication
router.use(authenticateToken);

// Departments
router.post(
  '/departments',
  validate(createDepartmentSchema),
  companyController.createDepartment
);
router.put(
  '/departments/:id',
  validate(updateDepartmentSchema),
  companyController.updateDepartment
);
router.post(
  '/departments/:id/move',
  validate(moveDepartmentSchema),
  companyController.moveDepartment
);
router.delete('/departments/:id', companyController.deleteDepartment);

// Hierarchy
router.get('/hierarchy', companyController.getHierarchyTree);

// Roles
router.post('/roles', validate(createRoleSchema), companyController.createRole);
router.get('/roles', companyController.listRoles);
router.put('/roles/:id', validate(updateRoleSchema), companyController.updateRole);
router.delete('/roles/:id', companyController.deleteRole);
router.post('/roles/:roleId/assign/:userId', companyController.assignUserToRole);
router.get('/departments/:id/roles', companyController.getRolesByDepartment);

// Users
router.get('/users', companyController.getUsers);

export default router;


