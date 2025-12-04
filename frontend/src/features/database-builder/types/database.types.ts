export interface ICustomTable {
  id: string;
  name: string; // snake_case
  displayName: string;
  description?: string;
  schema: ITableSchema;
  recordCount: number;
  createdAt: string;
  updatedAt?: string;
  companyId?: string;
}

export interface ITableSchema {
  fields: ITableField[];
}

export interface ITableField {
  id: string;
  name: string; // snake_case
  displayName: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'relation' | 'computed';
  required: boolean;
  unique?: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  formula?: string; // For computed fields
  relationConfig?: {
    toTable: string;
    toField: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  };
}

export interface ITableRecord {
  id: string;
  tableId: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ICreateTableRequest {
  name: string;
  displayName: string;
  description?: string;
}

export interface IUpdateTableRequest {
  displayName?: string;
  description?: string;
}

export interface IQueryRecordsParams {
  filters?: Record<string, any>;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface IQueryRecordsResponse {
  records: ITableRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

