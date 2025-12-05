export interface IDepartment {
  id: string;
  name: string;
  description?: string;
  parentId?: string | null;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDepartmentTreeNode extends IDepartment {
  children: IDepartmentTreeNode[];
  employeeCount: number;
  roleCount: number;
}

export interface IRole {
  id: string;
  name: string;
  description?: string;
  permissions: Record<string, boolean>;
  companyId: string;
  departmentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  employeeCount?: number;
}

export interface ICreateDepartmentRequest {
  name: string;
  description?: string;
  parentId?: string;
  companyId: string;
}

export type IUpdateDepartmentRequest = Partial<Omit<IDepartment, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>;

export interface ICreateRoleRequest {
  name: string;
  description?: string;
  departmentId?: string;
  companyId: string;
  permissions: Record<string, boolean>;
}

export type IUpdateRoleRequest = Partial<Omit<IRole, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>;

export interface ICompany {
  id: string;
  name: string;
  domain: string | null;
  logo: string | null;
  isActive: boolean;
  primaryColor: string;
  secondaryColor: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUpdateCompanyRequest {
  name?: string;
  domain?: string | null;
  logo?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  isActive?: boolean;
}


