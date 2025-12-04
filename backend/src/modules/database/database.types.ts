export interface ITableField {
  id: string;
  name: string; // snake_case (employee_name, date_of_birth)
  displayName: string; // Human readable
  type: 'text' | 'number' | 'boolean' | 'date' | 'relation' | 'computed';
  required: boolean;
  unique?: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  // For computed fields
  formula?: string; // e.g., "first_name + ' ' + last_name"
}

export interface ITableSchema {
  fields: ITableField[];
}

export interface ITableRelation {
  id: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  fromTable: string;
  toTable: string;
  fromField: string;
  toField: string;
}

export interface ICustomTable {
  id: string;
  name: string; // snake_case (employees, purchase_orders)
  displayName: string; // Human readable (Employees, Purchase Orders)
  description?: string;
  schema: ITableSchema;
  relations: ITableRelation[];
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
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

export interface IAddFieldRequest {
  name: string;
  displayName: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'relation' | 'computed';
  required?: boolean;
  unique?: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  formula?: string;
}

export interface IUpdateFieldRequest {
  displayName?: string;
  type?: 'text' | 'number' | 'boolean' | 'date' | 'relation' | 'computed';
  required?: boolean;
  unique?: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  formula?: string;
}

export interface ICreateRelationRequest {
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  fromTable: string;
  toTable: string;
  fromField: string;
  toField: string;
}

export interface IQueryRecordsOptions {
  filters?: Record<string, any>;
  sort?: { field: string; order: 'asc' | 'desc' };
  page?: number;
  limit?: number;
}

export interface IQueryRecordsResponse {
  records: any[];
  total: number;
  page: number;
  totalPages: number;
}

export interface IImportCSVResponse {
  imported: number;
  errors: Array<{ row: number; error: string }>;
}

