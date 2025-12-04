export interface ITaskField {
  id: string;
  type: 'text' | 'number' | 'date' | 'dropdown' | 'multi-select' | 'checkbox' | 'file' | 'image' | 'rich-text' | 'field-group';
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[]; // for dropdown/multi-select
  };
  conditionalLogic?: {
    showIf: {
      fieldId: string;
      operator: 'equals' | 'not_equals' | 'contains';
      value: any;
    }[];
  };
  order: number;
}

export interface ITask {
  id: string;
  name: string;
  description?: string;
  version: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DEPRECATED';
  fields: ITaskField[];
  validations: any[];
  logic: any;
  companyId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface ICreateTaskRequest {
  name: string;
  description?: string;
  companyId: string;
  createdById: string;
}

export interface IUpdateTaskRequest {
  name?: string;
  description?: string;
  fields?: ITaskField[];
  logic?: any;
}

export interface IListTasksFilters {
  companyId: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DEPRECATED';
  search?: string;
  page?: number;
  limit?: number;
}

export interface IListTasksResponse {
  tasks: ITask[];
  total: number;
  page: number;
  totalPages: number;
}

