import { apiClient, extractApiData, type ApiResponse, type PaginationParams, type ListResponse } from '@/lib/api-client';

// Types
export type FieldType = 
  | 'TEXT' 
  | 'NUMBER' 
  | 'BOOLEAN' 
  | 'DATE' 
  | 'DATETIME' 
  | 'JSON' 
  | 'UUID' 
  | 'FOREIGN_KEY';

export type RelationType = 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_MANY';

export interface DatabaseField {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
  unique: boolean;
  isPrimaryKey: boolean;
  defaultValue?: unknown;
  helpText?: string;
  relatedTableId?: string;
  relationType?: RelationType;
}

export interface DatabaseRelation {
  id: string;
  fromTableId: string;
  toTableId: string;
  fromFieldId: string;
  toFieldId: string;
  type: RelationType;
}

export interface DatabaseTable {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  fields: DatabaseField[];
  relations: DatabaseRelation[];
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTableRequest {
  name: string;
  displayName: string;
  description?: string;
}

export interface UpdateTableRequest {
  displayName?: string;
  description?: string;
}

export interface AddFieldRequest {
  name: string;
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  defaultValue?: unknown;
  helpText?: string;
  relatedTableId?: string;
  relationType?: RelationType;
}

export interface UpdateFieldRequest {
  name?: string;
  type?: FieldType;
  required?: boolean;
  unique?: boolean;
  defaultValue?: unknown;
  helpText?: string;
  relatedTableId?: string;
  relationType?: RelationType;
}

export interface CreateRelationRequest {
  toTableId: string;
  fromFieldId: string;
  toFieldId: string;
  type: RelationType;
}

export interface DatabaseRecord {
  id: string;
  [key: string]: unknown;
}

export interface QueryRecordsParams extends PaginationParams {
  filters?: string; // JSON string of filters
}

// API functions
export const databaseApi = {
  /**
   * List custom tables
   * GET /api/database
   */
  listTables: async (): Promise<DatabaseTable[]> => {
    const response = await apiClient.get<ApiResponse<DatabaseTable[]>>('/database');
    return extractApiData(response);
  },

  /**
   * Get table by ID
   * GET /api/database/:id
   */
  getTable: async (id: string): Promise<DatabaseTable> => {
    const response = await apiClient.get<ApiResponse<DatabaseTable>>(`/database/${id}`);
    return extractApiData(response);
  },

  /**
   * Create custom table
   * POST /api/database
   */
  createTable: async (data: CreateTableRequest): Promise<DatabaseTable> => {
    const response = await apiClient.post<ApiResponse<DatabaseTable>>('/database', data);
    return extractApiData(response);
  },

  /**
   * Update table
   * PUT /api/database/:id
   */
  updateTable: async (id: string, data: UpdateTableRequest): Promise<DatabaseTable> => {
    const response = await apiClient.put<ApiResponse<DatabaseTable>>(`/database/${id}`, data);
    return extractApiData(response);
  },

  // Field operations
  /**
   * Add field to table
   * POST /api/database/:id/fields
   */
  addField: async (id: string, data: AddFieldRequest): Promise<DatabaseField> => {
    const response = await apiClient.post<ApiResponse<DatabaseField>>(`/database/${id}/fields`, data);
    return extractApiData(response);
  },

  /**
   * Update field
   * PUT /api/database/:id/fields/:fieldId
   */
  updateField: async (id: string, fieldId: string, data: UpdateFieldRequest): Promise<DatabaseField> => {
    const response = await apiClient.put<ApiResponse<DatabaseField>>(`/database/${id}/fields/${fieldId}`, data);
    return extractApiData(response);
  },

  /**
   * Delete field
   * DELETE /api/database/:id/fields/:fieldId
   */
  deleteField: async (id: string, fieldId: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/database/${id}/fields/${fieldId}`);
  },

  // Relation operations
  /**
   * Create relation
   * POST /api/database/:id/relations
   */
  createRelation: async (id: string, data: CreateRelationRequest): Promise<DatabaseRelation> => {
    const response = await apiClient.post<ApiResponse<DatabaseRelation>>(`/database/${id}/relations`, data);
    return extractApiData(response);
  },

  // Record operations
  /**
   * Query records
   * GET /api/database/:id/records
   */
  queryRecords: async (id: string, params?: QueryRecordsParams): Promise<ListResponse<DatabaseRecord>> => {
    const response = await apiClient.get<ApiResponse<ListResponse<DatabaseRecord>>>(`/database/${id}/records`, { params });
    return extractApiData(response);
  },

  /**
   * Insert record
   * POST /api/database/:id/records
   */
  insertRecord: async (id: string, data: Record<string, unknown>): Promise<DatabaseRecord> => {
    const response = await apiClient.post<ApiResponse<DatabaseRecord>>(`/database/${id}/records`, data);
    return extractApiData(response);
  },

  /**
   * Update record
   * PUT /api/database/:id/records/:recordId
   */
  updateRecord: async (id: string, recordId: string, data: Record<string, unknown>): Promise<DatabaseRecord> => {
    const response = await apiClient.put<ApiResponse<DatabaseRecord>>(`/database/${id}/records/${recordId}`, data);
    return extractApiData(response);
  },

  /**
   * Delete record
   * DELETE /api/database/:id/records/:recordId
   */
  deleteRecord: async (id: string, recordId: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/database/${id}/records/${recordId}`);
  },

  // Import/Export operations
  /**
   * Import CSV file
   * POST /api/database/:id/import
   */
  importCSV: async (id: string, file: File): Promise<{ imported: number; errors: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<{ imported: number; errors: number }>>(`/database/${id}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return extractApiData(response);
  },

  /**
   * Export table to CSV
   * GET /api/database/:id/export
   */
  exportCSV: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/database/${id}/export`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

