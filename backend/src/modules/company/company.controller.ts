import { Request, Response, NextFunction } from 'express';
import { companyService } from './company.service';
import { successResponse } from '../../common/utils/response';
import { getCompanyIdForUser } from '../../common/utils/company-helper';

class CompanyController {
  // POST /api/company/departments
  createDepartment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_ERROR', message: 'Not authenticated' },
        });
      }

      const companyId = await getCompanyIdForUser(user, req);
      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'COMPANY_REQUIRED', 
            message: user.role === 'DEVELOPER' 
              ? 'Please select a company or provide x-company-id header'
              : 'User must be associated with a company' 
          },
        });
      }

      const { name, description, parentId } = req.body;

      const department = await companyService.createDepartment({
        name,
        description,
        parentId,
        companyId,
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
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_ERROR', message: 'Not authenticated' },
        });
      }

      const companyId = await getCompanyIdForUser(user, req);
      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'COMPANY_REQUIRED', 
            message: user.role === 'DEVELOPER' 
              ? 'Please select a company or provide x-company-id header'
              : 'User must be associated with a company' 
          },
        });
      }

      const tree = await companyService.getHierarchyTree(companyId);
      res.json(successResponse(tree));
    } catch (error) {
      next(error);
    }
  };

  // POST /api/company/roles
  createRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_ERROR', message: 'Not authenticated' },
        });
      }

      const companyId = await getCompanyIdForUser(user, req);
      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'COMPANY_REQUIRED', 
            message: user.role === 'DEVELOPER' 
              ? 'Please select a company or provide x-company-id header'
              : 'User must be associated with a company' 
          },
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
        companyId,
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
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_ERROR', message: 'Not authenticated' },
        });
      }

      const companyId = await getCompanyIdForUser(user, req);
      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'COMPANY_REQUIRED', 
            message: user.role === 'DEVELOPER' 
              ? 'Please select a company or provide x-company-id header'
              : 'User must be associated with a company' 
          },
        });
      }

      const { departmentId } = req.query;
      const deptId = departmentId && typeof departmentId === 'string' && departmentId.trim() !== ''
        ? departmentId.trim()
        : undefined;
      const roles = await companyService.listRoles(companyId, deptId);
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
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_ERROR', message: 'Not authenticated' },
        });
      }

      const companyId = await getCompanyIdForUser(user, req);
      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'COMPANY_REQUIRED', 
            message: user.role === 'DEVELOPER' 
              ? 'Please select a company or provide x-company-id header'
              : 'User must be associated with a company' 
          },
        });
      }

      const users = await companyService.getUsers(companyId);
      res.json(successResponse({ users }));
    } catch (error) {
      next(error);
    }
  };

  // GET /api/company/accessible
  getAccessibleCompanies = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
        });
      }

      const companies = await companyService.getAccessibleCompanies(req.user.id);
      res.json(successResponse(companies));
    } catch (error) {
      next(error);
    }
  };

  // POST /api/company/switch/:companyId
  switchCompanyContext = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
        });
      }

      const { companyId } = req.params;
      const company = await companyService.switchCompanyContext(req.user.id, companyId);
      res.json(successResponse(company));
    } catch (error) {
      next(error);
    }
  };

  // GET /api/company
  getCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_ERROR', message: 'Not authenticated' },
        });
      }

      const companyId = await getCompanyIdForUser(user, req);
      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'COMPANY_REQUIRED', 
            message: user.role === 'DEVELOPER' 
              ? 'Please select a company or provide x-company-id header'
              : 'User must be associated with a company' 
          },
        });
      }

      const company = await companyService.getCompany(companyId);
      res.json(successResponse(company));
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/company
  updateCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_ERROR', message: 'Not authenticated' },
        });
      }

      const companyId = await getCompanyIdForUser(user, req);
      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'COMPANY_REQUIRED', 
            message: user.role === 'DEVELOPER' 
              ? 'Please select a company or provide x-company-id header'
              : 'User must be associated with a company' 
          },
        });
      }

      const company = await companyService.updateCompany(companyId, req.body);
      res.json(successResponse(company));
    } catch (error) {
      next(error);
    }
  };
}

export const companyController = new CompanyController();


