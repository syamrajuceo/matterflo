export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'dropdown'
  | 'multi-select'
  | 'checkbox'
  | 'file'
  | 'image'
  | 'rich-text'
  | 'field-group';

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  options?: string[]; // for dropdown/multi-select
}

export interface ConditionalLogic {
  showIf: {
    fieldId: string;
    operator: 'equals' | 'not_equals' | 'contains';
    value: any;
  }[];
}

export interface ITaskField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: FieldValidation;
  conditionalLogic?: ConditionalLogic;
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
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface ICreateTaskRequest {
  name: string;
  description?: string;
}

export interface IUpdateTaskRequest {
  name?: string;
  description?: string;
  fields?: ITaskField[];
  logic?: any;
}

export interface IListTasksParams {
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

