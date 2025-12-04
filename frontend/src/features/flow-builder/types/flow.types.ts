export type FlowStatus = 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'ARCHIVED';

export interface IFlowLevelTask {
  id: string;
  levelId: string;
  taskId: string;
  order: number;
  config: any;
  createdAt: string;
  task?: {
    id: string;
    name: string;
  };
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
  outgoingBranches?: IFlowBranch[];
  createdAt: string;
  updatedAt: string;
}

export interface IFlowBranch {
  id: string;
  name: string;
  fromLevelId: string;
  toLevelId: string;
  conditions: any; // JSON structure for conditions
  priority: number;
  flowId: string;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface ICreateFlowRequest {
  name: string;
  description?: string;
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

export interface IUpdateFlowBranchRequest {
  name?: string;
  conditions?: any;
  priority?: number;
}

export interface IAddTaskToLevelRequest {
  taskId: string;
  order?: number;
  config?: any;
}

export interface IListFlowsParams {
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

