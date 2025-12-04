import { prisma } from '../../common/config/database.config';
import { NotFoundError, ValidationError } from '../../common/errors';
import {
  IDepartment,
  IDepartmentTreeNode,
  IRole,
  ICreateDepartmentRequest,
  IUpdateDepartmentRequest,
  ICreateRoleRequest,
  IUpdateRoleRequest,
} from './company.types';

class CompanyService {
  // Map Prisma Department to IDepartment
  private mapDepartment(dep: any): IDepartment {
    return {
      id: dep.id,
      name: dep.name,
      description: dep.description ?? undefined,
      parentId: dep.parentId,
      companyId: dep.companyId,
      createdAt: dep.createdAt,
      updatedAt: dep.updatedAt,
    };
  }

  // Map Prisma Role to IRole
  private mapRole(role: any, employeeCount?: number): IRole {
    let permissions: Record<string, boolean> = {};
    try {
      if (role.permissions) {
        if (typeof role.permissions === 'string') {
          permissions = JSON.parse(role.permissions);
        } else if (typeof role.permissions === 'object') {
          permissions = role.permissions as Record<string, boolean>;
        }
      }
    } catch (err) {
      console.error(`Error parsing permissions for role ${role.id}:`, err);
      permissions = {};
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description ?? undefined,
      permissions,
      companyId: role.companyId,
      departmentId: role.departmentId,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      employeeCount,
    };
  }

  // Create department
  async createDepartment(data: ICreateDepartmentRequest): Promise<IDepartment> {
    try {
      // Validate parent department (if provided)
      if (data.parentId) {
        const parent = await prisma.department.findUnique({
          where: { id: data.parentId },
        });

        if (!parent) {
          throw new NotFoundError('Parent department');
        }

        if (parent.companyId !== data.companyId) {
          throw new ValidationError('Parent department belongs to a different company', {
            parentId: data.parentId,
            companyId: data.companyId,
          });
        }
      }

      const department = await prisma.department.create({
        data: {
          name: data.name,
          description: data.description,
          parentId: data.parentId || null,
          companyId: data.companyId,
        },
      });

      return this.mapDepartment(department);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error creating department:', error);
      throw error;
    }
  }

  // Update department
  async updateDepartment(id: string, data: IUpdateDepartmentRequest): Promise<IDepartment> {
    try {
      const existing = await prisma.department.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundError('Department');
      }

      // Prevent changing companyId through this method
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;

      const department = await prisma.department.update({
        where: { id },
        data: updateData,
      });

      return this.mapDepartment(department);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error updating department:', error);
      throw error;
    }
  }

  // Move department (change parent)
  async moveDepartment(id: string, newParentId: string | null): Promise<IDepartment> {
    try {
      const department = await prisma.department.findUnique({
        where: { id },
      });

      if (!department) {
        throw new NotFoundError('Department');
      }

      if (newParentId === id) {
        throw new ValidationError('Department cannot be its own parent', { id });
      }

      if (newParentId) {
        const newParent = await prisma.department.findUnique({
          where: { id: newParentId },
        });

        if (!newParent) {
          throw new NotFoundError('Parent department');
        }

        if (newParent.companyId !== department.companyId) {
          throw new ValidationError('Parent department must belong to the same company', {
            id,
            newParentId,
          });
        }

        // Prevent cycles: ensure newParent is not a child of this department
        const allDepartments = await prisma.department.findMany({
          where: { companyId: department.companyId },
        });
        const childrenIds = this.getDescendantIds(allDepartments, id);
        if (childrenIds.has(newParentId)) {
          throw new ValidationError('Cannot move department under its own descendant', {
            id,
            newParentId,
          });
        }
      }

      const updated = await prisma.department.update({
        where: { id },
        data: {
          parentId: newParentId,
        },
      });

      return this.mapDepartment(updated);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      console.error('Error moving department:', error);
      throw error;
    }
  }

  // Delete department
  async deleteDepartment(id: string): Promise<void> {
    try {
      const department = await prisma.department.findUnique({
        where: { id },
        include: {
          children: true,
          roles: true,
        },
      });

      if (!department) {
        throw new NotFoundError('Department');
      }

      // Prevent delete if has children
      if (department.children && department.children.length > 0) {
        throw new ValidationError('Cannot delete department with child departments', { id });
      }

      // Prevent delete if has roles (which may have employees)
      if (department.roles && department.roles.length > 0) {
        throw new ValidationError('Cannot delete department with roles assigned', { id });
      }

      await prisma.department.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      console.error('Error deleting department:', error);
      throw error;
    }
  }

  // Get hierarchy tree with counts
  async getHierarchyTree(companyId: string): Promise<IDepartmentTreeNode[]> {
    try {
      const [departments, roles, users] = await Promise.all([
        prisma.department.findMany({
          where: { companyId },
          orderBy: { name: 'asc' },
        }),
        prisma.role.findMany({
          where: { companyId },
        }),
        prisma.user.findMany({
          where: { companyId },
        }),
      ]);

      // Build role employee counts by role name (mapped to User.role enum)
      const employeeCountsByRoleName = new Map<string, number>();
      for (const user of users) {
        const roleName = user.role; // UserRole enum value
        employeeCountsByRoleName.set(roleName, (employeeCountsByRoleName.get(roleName) || 0) + 1);
      }

      // Precompute counts for each department
      const deptRoleCounts = new Map<string, number>();
      const deptEmployeeCounts = new Map<string, number>();

      for (const role of roles) {
        if (!role.departmentId) continue;
        const roleCount = (deptRoleCounts.get(role.departmentId) || 0) + 1;
        deptRoleCounts.set(role.departmentId, roleCount);

        const employeesForRole = employeeCountsByRoleName.get(role.name) || 0;
        const currentEmp = deptEmployeeCounts.get(role.departmentId) || 0;
        deptEmployeeCounts.set(role.departmentId, currentEmp + employeesForRole);
      }

      const deptMap = new Map<string, IDepartmentTreeNode>();
      for (const dep of departments) {
        const base = this.mapDepartment(dep);
        const node: IDepartmentTreeNode = {
          ...base,
          children: [],
          roleCount: deptRoleCounts.get(dep.id) || 0,
          employeeCount: deptEmployeeCounts.get(dep.id) || 0,
        };
        deptMap.set(dep.id, node);
      }

      const roots: IDepartmentTreeNode[] = [];

      for (const node of deptMap.values()) {
        if (node.parentId && deptMap.has(node.parentId)) {
          deptMap.get(node.parentId)!.children.push(node);
        } else {
          roots.push(node);
        }
      }

      return roots;
    } catch (error) {
      console.error('Error getting hierarchy tree:', error);
      throw error;
    }
  }

  // Helper to get all descendant department IDs
  private getDescendantIds(departments: any[], rootId: string): Set<string> {
    const childrenByParent = new Map<string, string[]>();
    for (const dep of departments) {
      if (!dep.parentId) continue;
      const list = childrenByParent.get(dep.parentId) || [];
      list.push(dep.id);
      childrenByParent.set(dep.parentId, list);
    }

    const result = new Set<string>();
    const stack: string[] = [rootId];

    while (stack.length > 0) {
      const current = stack.pop()!;
      const children = childrenByParent.get(current) || [];
      for (const childId of children) {
        if (!result.has(childId)) {
          result.add(childId);
          stack.push(childId);
        }
      }
    }

    return result;
  }

  // Create role
  async createRole(data: ICreateRoleRequest): Promise<IRole> {
    try {
      // Validate company
      const company = await prisma.company.findUnique({
        where: { id: data.companyId },
      });
      if (!company) {
        throw new NotFoundError('Company');
      }

      // Validate department (if provided)
      if (data.departmentId) {
        const dept = await prisma.department.findUnique({
          where: { id: data.departmentId },
        });
        if (!dept || dept.companyId !== data.companyId) {
          throw new ValidationError('Department not found in company', {
            departmentId: data.departmentId,
            companyId: data.companyId,
          });
        }
      }

      // Trim and validate name
      const trimmedName = data.name.trim();
      if (!trimmedName) {
        throw new ValidationError('Role name cannot be empty', { name: data.name });
      }

      // Check if role name already exists in company
      const existingRole = await prisma.role.findFirst({
        where: {
          companyId: data.companyId,
          name: trimmedName,
        },
      });

      if (existingRole) {
        throw new ValidationError(`A role with the name "${trimmedName}" already exists in this company`, {
          name: trimmedName,
          companyId: data.companyId,
        });
      }

      // Ensure permissions is a valid object
      let permissions: Record<string, boolean> = {};
      if (data.permissions) {
        if (typeof data.permissions === 'object' && !Array.isArray(data.permissions)) {
          // Filter out any non-boolean values and ensure all values are booleans
          permissions = Object.entries(data.permissions).reduce((acc, [key, value]) => {
            if (typeof value === 'boolean') {
              acc[key] = value;
            }
            return acc;
          }, {} as Record<string, boolean>);
        }
      }

      // Handle departmentId - convert undefined, empty, or '__none__' to null
      let cleanDepartmentId: string | null = null;
      if (data.departmentId && data.departmentId !== null && data.departmentId !== '' && data.departmentId !== '__none__') {
        const deptIdStr = String(data.departmentId).trim();
        if (deptIdStr) {
          // Validate it's a UUID format
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(deptIdStr)) {
            cleanDepartmentId = deptIdStr;
          } else {
            throw new ValidationError('Invalid department ID format', {
              departmentId: data.departmentId,
            });
          }
        }
      }

      console.log('Creating role with data:', {
        name: trimmedName,
        description: data.description?.trim() || null,
        permissions,
        companyId: data.companyId,
        departmentId: cleanDepartmentId,
      });

      let role;
      try {
        role = await prisma.role.create({
          data: {
            name: trimmedName,
            description: data.description?.trim() || null,
            permissions: permissions as any,
            companyId: data.companyId,
            departmentId: cleanDepartmentId,
          },
        });
      } catch (prismaError: any) {
        console.error('Prisma error creating role:', prismaError);
        if (prismaError.code === 'P2002') {
          // Unique constraint violation
          throw new ValidationError(`A role with the name "${trimmedName}" already exists in this company`, {
            name: trimmedName,
            companyId: data.companyId,
          });
        }
        throw prismaError;
      }

      // Compute employee count for this role
      const employeeCount = await prisma.user.count({
        where: {
          companyId: data.companyId,
          role: data.name as any, // Map role.name to User.role enum
        },
      });

      return this.mapRole(role, employeeCount);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error creating role:', error);
      throw error;
    }
  }

  // Update role
  async updateRole(id: string, data: IUpdateRoleRequest): Promise<IRole> {
    try {
      const existing = await prisma.role.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundError('Role');
      }

      // Check for duplicate name if name is being changed
      if (data.name !== undefined && data.name !== null) {
        const trimmedName = String(data.name).trim();
        if (!trimmedName) {
          throw new ValidationError('Role name cannot be empty', { name: data.name });
        }
        const existingNameTrimmed = existing.name.trim();
        
        // Only check for duplicates if the name is actually changing
        if (trimmedName !== existingNameTrimmed) {
          const duplicateRole = await prisma.role.findFirst({
            where: {
              companyId: existing.companyId,
              name: trimmedName,
              id: { not: id }, // Exclude current role
            },
          });

          if (duplicateRole) {
            throw new ValidationError(`A role with the name "${trimmedName}" already exists in this company`, {
              name: trimmedName,
              companyId: existing.companyId,
            });
          }
        }
      }

      const updateData: any = {};
      if (data.name !== undefined && data.name !== null) {
        const trimmedName = String(data.name).trim();
        if (trimmedName) {
          updateData.name = trimmedName;
        }
      }
      if (data.description !== undefined) {
        updateData.description = data.description ? String(data.description).trim() || null : null;
      }
      if (data.permissions !== undefined) {
        if (data.permissions && typeof data.permissions === 'object' && !Array.isArray(data.permissions)) {
          // Filter out any non-boolean values and ensure all values are booleans
          const cleanPermissions = Object.entries(data.permissions).reduce((acc, [key, value]) => {
            if (typeof value === 'boolean') {
              acc[key] = value;
            }
            return acc;
          }, {} as Record<string, boolean>);
          updateData.permissions = cleanPermissions as any;
        } else {
          updateData.permissions = {};
        }
      }

      if (data.departmentId !== undefined) {
        // Validation should have already transformed '__none__' to null
        // But handle it defensively here too
        if (data.departmentId === null || data.departmentId === '' || data.departmentId === '__none__') {
          updateData.departmentId = null;
        } else if (typeof data.departmentId === 'string' && data.departmentId.trim()) {
          const dept = await prisma.department.findUnique({
            where: { id: data.departmentId.trim() },
          });
          if (!dept || dept.companyId !== existing.companyId) {
            throw new ValidationError('Department not found in company', {
              departmentId: data.departmentId,
              companyId: existing.companyId,
            });
          }
          updateData.departmentId = data.departmentId.trim();
        }
      }

      // Only update if there's something to update
      if (Object.keys(updateData).length === 0) {
        // No changes, return existing role
        const employeeCount = await prisma.user.count({
          where: {
            companyId: existing.companyId,
            role: existing.name as any,
          },
        });
        return this.mapRole(existing, employeeCount);
      }

      let role;
      try {
        role = await prisma.role.update({
          where: { id },
          data: updateData,
        });
      } catch (prismaError: any) {
        console.error('Prisma error updating role:', prismaError);
        console.error('Update data:', updateData);
        if (prismaError.code === 'P2002') {
          // Unique constraint violation
          throw new ValidationError(`A role with this name already exists in this company`, {
            name: updateData.name,
            companyId: existing.companyId,
          });
        }
        throw prismaError;
      }

      // Recompute employee count
      let employeeCount = 0;
      try {
        employeeCount = await prisma.user.count({
          where: {
            companyId: role.companyId,
            role: role.name as any,
          },
        });
      } catch (countError) {
        // If counting fails (e.g., role.name doesn't match UserRole enum), just use 0
        console.warn('Failed to count employees for role:', countError);
        employeeCount = 0;
      }

      return this.mapRole(role, employeeCount);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      // Log the full error for debugging
      console.error('Error updating role:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  // Delete role
  async deleteRole(id: string): Promise<void> {
    try {
      const role = await prisma.role.findUnique({
        where: { id },
      });

      if (!role) {
        throw new NotFoundError('Role');
      }

      await prisma.role.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error deleting role:', error);
      throw error;
    }
  }

  // Assign user to role
  async assignUserToRole(userId: string, roleId: string): Promise<void> {
    try {
      const [user, role] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.role.findUnique({ where: { id: roleId } }),
      ]);

      if (!user) {
        throw new NotFoundError('User');
      }
      if (!role) {
        throw new NotFoundError('Role');
      }

      if (user.companyId !== role.companyId) {
        throw new ValidationError('User and role must belong to the same company', {
          userId,
          roleId,
        });
      }

      // Map business role name to UserRole enum if possible
      // If the role name does not match any enum value, keep the existing user role.
      const newRoleEnum = ['DEVELOPER', 'ADMIN', 'MANAGER', 'EMPLOYEE'].includes(role.name)
        ? (role.name as any)
        : user.role;

      await prisma.user.update({
        where: { id: userId },
        data: {
          role: newRoleEnum,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      console.error('Error assigning user to role:', error);
      throw error;
    }
  }

  // List roles (optionally filtered by department)
  async listRoles(companyId: string, departmentId?: string): Promise<IRole[]> {
    try {
      const where: any = { companyId };
      if (departmentId && departmentId.trim() !== '') {
        where.departmentId = departmentId;
      }

      const roles = await prisma.role.findMany({
        where,
        orderBy: { name: 'asc' },
      });

      // Attach employee counts to each role
      const rolesWithCounts: IRole[] = [];
      for (const role of roles) {
        try {
          const employeeCount = await prisma.user.count({
            where: {
              companyId: role.companyId,
              role: role.name as any,
            },
          });
          rolesWithCounts.push(this.mapRole(role, employeeCount));
        } catch (err) {
          // If employee count query fails, still include the role with 0 count
          console.error(`Error getting employee count for role ${role.id}:`, err);
          rolesWithCounts.push(this.mapRole(role, 0));
        }
      }

      return rolesWithCounts;
    } catch (error) {
      console.error('Error listing roles:', error);
      throw error;
    }
  }

  // Get roles by department
  async getRolesByDepartment(departmentId: string): Promise<IRole[]> {
    try {
      const dept = await prisma.department.findUnique({
        where: { id: departmentId },
      });

      if (!dept) {
        throw new NotFoundError('Department');
      }

      const roles = await prisma.role.findMany({
        where: { departmentId },
      });

      // Attach employee counts to each role
      const rolesWithCounts: IRole[] = [];
      for (const role of roles) {
        const employeeCount = await prisma.user.count({
          where: {
            companyId: role.companyId,
            role: role.name as any,
          },
        });
        rolesWithCounts.push(this.mapRole(role, employeeCount));
      }

      return rolesWithCounts;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error getting roles by department:', error);
      throw error;
    }
  }

  // Get users in company
  async getUsers(companyId: string): Promise<any[]> {
    try {
      const users = await prisma.user.findMany({
        where: { companyId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          companyId: true,
        },
        orderBy: { email: 'asc' },
      });

      return users;
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }
}

export const companyService = new CompanyService();


