import { Request, Response, NextFunction } from 'express';
import { companyService } from './company.service';
import { successResponse } from '../../common/utils/response';

class CompanyController {
  // POST /api/company/departments
  createDepartment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user || !user.companyId) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_ERROR', message: 'User must be associated with a company' },
        });
      }

      const { name, description, parentId } = req.body;

      const department = await companyService.createDepartment({
        name,
        description,
        parentId,
        companyId: user.companyId,
      });

      res.status(201).json(successResponse(department));
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/company/departments/:id
  updateDepartment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const department = await companyService.updateDepartment(id, req.body);
      res.json(successResponse(department));
    } catch (error) {
      next(error);
    }
  };

  // POST /api/company/departments/:id/move
  moveDepartment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { newParentId } = req.body;
      const department = await companyService.moveDepartment(id, newParentId);
      res.json(successResponse(department));
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/company/departments/:id
  deleteDepartment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await companyService.deleteDepartment(id);
      res.json(successResponse({ message: 'Department deleted successfully' }));
    } catch (error) {
      next(error);
    }
  };

  // GET /api/company/hierarchy
  getHierarchyTree = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user || !user.companyId) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_ERROR', message: 'User must be associated with a company' },
        });
      }

      const tree = await companyService.getHierarchyTree(user.companyId);
      res.json(successResponse(tree));
    } catch (error) {
      next(error);
    }
  };

  // POST /api/company/roles
  createRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user || !user.companyId) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_ERROR', message: 'User must be associated with a company' },
        });
      }

      const { name, description, departmentId, permissions } = req.body;

      console.log('Create role request body:', { name, description, departmentId, permissions });

      // Transform '__none__' or empty string to null for departmentId
      const cleanDepartmentId = 
        !departmentId || departmentId === '__none__' || departmentId === ''
          ? null
          : departmentId;

      const role = await companyService.createRole({
        name,
        description,
        departmentId: cleanDepartmentId,
        permissions,
        companyId: user.companyId,
      });

      res.status(201).json(successResponse(role));
    } catch (error) {
      console.error('Error in createRole controller:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      next(error);
    }
  };

  // PUT /api/company/roles/:id
  updateRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name, description, departmentId, permissions } = req.body;

      console.log('Update role request body:', { id, name, description, departmentId, permissions });

      // Transform '__none__' or empty string to null for departmentId
      const cleanDepartmentId = 
        !departmentId || departmentId === '__none__' || departmentId === ''
          ? null
          : departmentId;
      
      const role = await companyService.updateRole(id, {
        name,
        description,
        departmentId: cleanDepartmentId,
        permissions,
      });
      res.json(successResponse(role));
    } catch (error) {
      console.error('Error in updateRole controller:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      next(error);
    }
  };

  // DELETE /api/company/roles/:id
  deleteRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await companyService.deleteRole(id);
      res.json(successResponse({ message: 'Role deleted successfully' }));
    } catch (error) {
      next(error);
    }
  };

  // POST /api/company/roles/:roleId/assign/:userId
  assignUserToRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roleId, userId } = req.params;
      await companyService.assignUserToRole(userId, roleId);
      res.json(successResponse({ message: 'User assigned to role successfully' }));
    } catch (error) {
      next(error);
    }
  };

  // GET /api/company/roles
  listRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user || !user.companyId) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_ERROR', message: 'User must be associated with a company' },
        });
      }

      const { departmentId } = req.query;
      const deptId = departmentId && typeof departmentId === 'string' && departmentId.trim() !== ''
        ? departmentId.trim()
        : undefined;
      const roles = await companyService.listRoles(user.companyId, deptId);
      res.json(successResponse(roles));
    } catch (error) {
      next(error);
    }
  };

  // GET /api/company/departments/:id/roles
  getRolesByDepartment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const roles = await companyService.getRolesByDepartment(id);
      res.json(successResponse(roles));
    } catch (error) {
      next(error);
    }
  };

  // GET /api/company/users
  getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user || !user.companyId) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_ERROR', message: 'User must be associated with a company' },
        });
      }

      const users = await companyService.getUsers(user.companyId);
      res.json(successResponse({ users }));
    } catch (error) {
      next(error);
    }
  };
}

export const companyController = new CompanyController();


