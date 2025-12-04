export type FlowStatus = 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'ARCHIVED';

export interface IFlowLevelTask {
  id: string;
  levelId: string;
  taskId: string;
  order: number;
  config: any;
  createdAt: Date;
}

export interface IFlowLevel {
  id: string;
  name: string;
  description?: string;
  order: number;
  flowId: string;
  config: any;
  tasks: IFlowLevelTask[];
  roles: string[]; // Role IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface IFlowBranch {
  id: string;
  name: string;
  fromLevelId: string;
  toLevelId: string;
  conditions: any; // JSON structure for conditions
  priority: number;
  flowId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFlow {
  id: string;
  name: string;
  description?: string;
  version: string;
  status: FlowStatus;
  config: any;
  companyId: string;
  createdById: string;
  levels: IFlowLevel[];
  branches: IFlowBranch[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface ICreateFlowRequest {
  name: string;
  description?: string;
  companyId: string;
  createdById: string;
}

export interface IUpdateFlowRequest {
  name?: string;
  description?: string;
  config?: any;
}

export interface ICreateFlowLevelRequest {
  name: string;
  description?: string;
  order?: number;
  config?: any;
}

export interface IUpdateFlowLevelRequest {
  name?: string;
  description?: string;
  config?: any;
}

export interface ICreateFlowBranchRequest {
  name: string;
  fromLevelId: string;
  toLevelId: string;
  conditions: any;
  priority?: number;
}

export interface IAddTaskToLevelRequest {
  taskId: string;
  order?: number;
  config?: any;
}

export interface IListFlowsFilters {
  companyId: string;
  status?: FlowStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface IListFlowsResponse {
  flows: IFlow[];
  total: number;
  page: number;
  totalPages: number;
}

