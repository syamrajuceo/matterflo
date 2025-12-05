import { apiClient, extractApiData, type ApiResponse } from '@/lib/api-client';

// Types
export interface Department {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  companyId: string;
  children?: Department[];
  roles?: Role[];
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  departmentId?: string;
  permissions?: Record<string, unknown>;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  departmentId?: string;
  companyId: string;
}

export interface HierarchyTree {
  company: {
    id: string;
    name: string;
  };
  departments: Department[];
}

export interface CreateDepartmentRequest {
  name: string;
  description?: string;
  parentId?: string;
}

export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
}

export interface MoveDepartmentRequest {
  parentId?: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  departmentId?: string;
  permissions?: Record<string, unknown>;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: Record<string, unknown>;
}

export interface ListRolesParams {
  departmentId?: string;
}

// API functions
export const companyApi = {
  /**
   * Get company hierarchy tree
   * GET /api/company/hierarchy
   */
  getHierarchyTree: async (): Promise<HierarchyTree> => {
    const response = await apiClient.get<ApiResponse<HierarchyTree>>('/company/hierarchy');
    return extractApiData(response);
  },

  // Department operations
  /**
   * Create department
   * POST /api/company/departments
   */
  createDepartment: async (data: CreateDepartmentRequest): Promise<Department> => {
    const response = await apiClient.post<ApiResponse<Department>>('/company/departments', data);
    return extractApiData(response);
  },

  /**
   * Update department
   * PUT /api/company/departments/:id
   */
  updateDepartment: async (id: string, data: UpdateDepartmentRequest): Promise<Department> => {
    const response = await apiClient.put<ApiResponse<Department>>(`/company/departments/${id}`, data);
    return extractApiData(response);
  },

  /**
   * Delete department
   * DELETE /api/company/departments/:id
   */
  deleteDepartment: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/company/departments/${id}`);
  },

  /**
   * Move department
   * POST /api/company/departments/:id/move
   */
  moveDepartment: async (id: string, data: MoveDepartmentRequest): Promise<Department> => {
    const response = await apiClient.post<ApiResponse<Department>>(`/company/departments/${id}/move`, data);
    return extractApiData(response);
  },

  /**
   * Get roles by department
   * GET /api/company/departments/:id/roles
   */
  getRolesByDepartment: async (id: string): Promise<Role[]> => {
    const response = await apiClient.get<ApiResponse<Role[]>>(`/company/departments/${id}/roles`);
    return extractApiData(response);
  },

  // Role operations
  /**
   * List roles
   * GET /api/company/roles
   */
  listRoles: async (params?: ListRolesParams): Promise<Role[]> => {
    const response = await apiClient.get<ApiResponse<Role[]>>('/company/roles', { params });
    return extractApiData(response);
  },

  /**
   * Create role
   * POST /api/company/roles
   */
  createRole: async (data: CreateRoleRequest): Promise<Role> => {
    const response = await apiClient.post<ApiResponse<Role>>('/company/roles', data);
    return extractApiData(response);
  },

  /**
   * Update role
   * PUT /api/company/roles/:id
   */
  updateRole: async (id: string, data: UpdateRoleRequest): Promise<Role> => {
    const response = await apiClient.put<ApiResponse<Role>>(`/company/roles/${id}`, data);
    return extractApiData(response);
  },

  /**
   * Delete role
   * DELETE /api/company/roles/:id
   */
  deleteRole: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/company/roles/${id}`);
  },

  /**
   * Assign user to role
   * POST /api/company/roles/:roleId/assign/:userId
   */
  assignUserToRole: async (roleId: string, userId: string): Promise<void> => {
    await apiClient.post<ApiResponse<void>>(`/company/roles/${roleId}/assign/${userId}`);
  },

  // User operations
  /**
   * Get users in company
   * GET /api/company/users
   */
  getUsers: async (): Promise<CompanyUser[]> => {
    const response = await apiClient.get<ApiResponse<CompanyUser[]>>('/company/users');
    return extractApiData(response);
  },
};

