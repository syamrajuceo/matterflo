import { Router } from 'express';
import { authenticateToken, requireRole } from '../auth/auth.middleware';
import { canManageEmployees } from '../../common/middleware/authorization.middleware';
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

// Departments - Clients can manage (ADMIN, MANAGER, DEVELOPER)
router.post(
  '/departments',
  canManageEmployees,
  validate(createDepartmentSchema),
  companyController.createDepartment
);
router.put(
  '/departments/:id',
  canManageEmployees,
  validate(updateDepartmentSchema),
  companyController.updateDepartment
);
router.post(
  '/departments/:id/move',
  canManageEmployees,
  validate(moveDepartmentSchema),
  companyController.moveDepartment
);
router.delete('/departments/:id', canManageEmployees, companyController.deleteDepartment);

// Hierarchy - All authenticated users
router.get('/hierarchy', companyController.getHierarchyTree);

// Roles - Clients can manage (ADMIN, MANAGER, DEVELOPER)
router.post('/roles', canManageEmployees, validate(createRoleSchema), companyController.createRole);
router.get('/roles', companyController.listRoles);
router.put('/roles/:id', canManageEmployees, validate(updateRoleSchema), companyController.updateRole);
router.delete('/roles/:id', canManageEmployees, companyController.deleteRole);
router.post('/roles/:roleId/assign/:userId', canManageEmployees, companyController.assignUserToRole);
router.get('/departments/:id/roles', companyController.getRolesByDepartment);

// Users - Clients can view (ADMIN, MANAGER, DEVELOPER)
router.get('/users', canManageEmployees, companyController.getUsers);

// Company switching (for developers)
router.get('/accessible', companyController.getAccessibleCompanies);
router.post('/switch/:companyId', companyController.switchCompanyContext);

// Company settings (white-labeling) - All authenticated users can view, only admins/managers can update
router.get('/', companyController.getCompany);
router.put('/', canManageEmployees, companyController.updateCompany);

export default router;


