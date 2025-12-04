import axios from 'axios';

export interface Department {
  id: string;
  name: string;
  description?: string;
  parentId?: string | null;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentTreeNode extends Department {
  children: DepartmentTreeNode[];
  employeeCount: number;
  roleCount: number;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Record<string, boolean>;
  companyId: string;
  departmentId?: string | null;
  createdAt: string;
  updatedAt: string;
  employeeCount?: number;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  companyId?: string | null;
}

class CompanyService {
  // Departments
  async createDepartment(data: {
    name: string;
    description?: string;
    parentId?: string | null;
  }): Promise<Department> {
    const response = await axios.post<{ success: true; data: Department }>(
      '/company/departments',
      data
    );
    return response.data.data;
  }

  async getHierarchyTree(): Promise<DepartmentTreeNode[]> {
    const response = await axios.get<{ success: true; data: DepartmentTreeNode[] }>(
      '/company/hierarchy'
    );
    return response.data.data;
  }

  async updateDepartment(id: string, data: Partial<Department>): Promise<Department> {
    const response = await axios.put<{ success: true; data: Department }>(
      `/company/departments/${id}`,
      data
    );
    return response.data.data;
  }

  async moveDepartment(id: string, newParentId: string | null): Promise<void> {
    await axios.post(`/company/departments/${id}/move`, { newParentId });
  }

  async deleteDepartment(id: string): Promise<void> {
    await axios.delete(`/company/departments/${id}`);
  }

  // Roles
  async createRole(data: {
    name: string;
    description?: string;
    departmentId?: string;
    permissions: Record<string, boolean>;
  }): Promise<Role> {
    const payload: Record<string, unknown> = {
      name: data.name,
      permissions: data.permissions,
    };
    if (data.description?.trim()) {
      payload.description = data.description.trim();
    }
    // Only include departmentId if it's a valid UUID (not undefined, null, empty, or '__none__')
    if (data.departmentId && data.departmentId !== '__none__' && data.departmentId.trim()) {
      payload.departmentId = data.departmentId;
    }
    const response = await axios.post<{ success: true; data: Role }>('/company/roles', payload);
    return response.data.data;
  }

  async listRoles(departmentId?: string): Promise<Role[]> {
    const response = await axios.get<{ success: true; data: Role[] }>('/company/roles', {
      params: { departmentId },
    });
    return response.data.data;
  }

  async updateRole(id: string, data: Partial<Role>): Promise<Role> {
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) {
      payload.description = data.description?.trim() || undefined;
    }
    // For update, if departmentId is provided, set it (null to clear, valid UUID to assign)
    if (data.departmentId !== undefined) {
      if (data.departmentId === '__none__' || data.departmentId === '' || data.departmentId === null) {
        payload.departmentId = null;
      } else if (typeof data.departmentId === 'string' && data.departmentId.trim()) {
        payload.departmentId = data.departmentId.trim();
      }
    }
    if (data.permissions !== undefined) payload.permissions = data.permissions;
    const response = await axios.put<{ success: true; data: Role }>(`/company/roles/${id}`, payload);
    return response.data.data;
  }

  async deleteRole(id: string): Promise<void> {
    await axios.delete(`/company/roles/${id}`);
  }

  // User assignment
  async assignUserToRole(userId: string, roleId: string): Promise<void> {
    await axios.post(`/company/roles/${roleId}/assign/${userId}`);
  }

  // Users
  async getUsers(): Promise<User[]> {
    const response = await axios.get<{ success: true; data: { users: User[] } }>('/company/users');
    return response.data.data.users;
  }
}

export const companyService = new CompanyService();


