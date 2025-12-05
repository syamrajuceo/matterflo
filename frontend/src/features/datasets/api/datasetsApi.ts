import { apiClient, extractApiData, type ApiResponse, type ListResponse } from '@/lib/api-client';

// Types
export type SectionType = 
  | 'TASKS' 
  | 'DATA_TABLE' 
  | 'CHART' 
  | 'CARDS' 
  | 'TEXT';

export interface DatasetSection {
  id: string;
  type: SectionType;
  title?: string;
  config: Record<string, unknown>;
  order: number;
}

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  sections: DatasetSection[];
  companyId: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDatasetRequest {
  name: string;
  description?: string;
}

export interface UpdateDatasetRequest {
  name?: string;
  description?: string;
}

export interface AddSectionRequest {
  type: SectionType;
  title?: string;
  config: Record<string, unknown>;
}

export interface UpdateSectionRequest {
  type?: SectionType;
  title?: string;
  config?: Record<string, unknown>;
}

export interface ReorderSectionsRequest {
  sectionIds: string[];
}

export interface DatasetWithData extends Dataset {
  data: Record<string, unknown>;
}

// API functions
export const datasetsApi = {
  /**
   * List datasets
   * GET /api/datasets
   */
  listDatasets: async (): Promise<Dataset[]> => {
    const response = await apiClient.get<ApiResponse<Dataset[]>>('/datasets');
    return extractApiData(response);
  },

  /**
   * Get dataset by ID
   * GET /api/datasets/:id
   */
  getDataset: async (id: string): Promise<Dataset> => {
    const response = await apiClient.get<ApiResponse<Dataset>>(`/datasets/${id}`);
    return extractApiData(response);
  },

  /**
   * Create dataset
   * POST /api/datasets
   */
  createDataset: async (data: CreateDatasetRequest): Promise<Dataset> => {
    const response = await apiClient.post<ApiResponse<Dataset>>('/datasets', data);
    return extractApiData(response);
  },

  /**
   * Update dataset
   * PUT /api/datasets/:id
   */
  updateDataset: async (id: string, data: UpdateDatasetRequest): Promise<Dataset> => {
    const response = await apiClient.put<ApiResponse<Dataset>>(`/datasets/${id}`, data);
    return extractApiData(response);
  },

  /**
   * Delete dataset
   * DELETE /api/datasets/:id
   */
  deleteDataset: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/datasets/${id}`);
  },

  /**
   * Publish dataset
   * POST /api/datasets/:id/publish
   */
  publishDataset: async (id: string): Promise<Dataset> => {
    const response = await apiClient.post<ApiResponse<Dataset>>(`/datasets/${id}/publish`);
    return extractApiData(response);
  },

  // Section operations
  /**
   * Add section to dataset
   * POST /api/datasets/:id/sections
   */
  addSection: async (id: string, data: AddSectionRequest): Promise<DatasetSection> => {
    const response = await apiClient.post<ApiResponse<DatasetSection>>(`/datasets/${id}/sections`, data);
    return extractApiData(response);
  },

  /**
   * Update section
   * PUT /api/datasets/:id/sections/:sectionId
   */
  updateSection: async (id: string, sectionId: string, data: UpdateSectionRequest): Promise<DatasetSection> => {
    const response = await apiClient.put<ApiResponse<DatasetSection>>(`/datasets/${id}/sections/${sectionId}`, data);
    return extractApiData(response);
  },

  /**
   * Delete section
   * DELETE /api/datasets/:id/sections/:sectionId
   */
  deleteSection: async (id: string, sectionId: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/datasets/${id}/sections/${sectionId}`);
  },

  /**
   * Reorder sections
   * PUT /api/datasets/:id/sections/reorder
   */
  reorderSections: async (id: string, data: ReorderSectionsRequest): Promise<void> => {
    await apiClient.put<ApiResponse<void>>(`/datasets/${id}/sections/reorder`, data);
  },

  /**
   * Get dataset with data
   * GET /api/datasets/:id/data
   */
  getDatasetWithData: async (id: string): Promise<DatasetWithData> => {
    const response = await apiClient.get<ApiResponse<DatasetWithData>>(`/datasets/${id}/data`);
    return extractApiData(response);
  },
};

