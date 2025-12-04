import axios from 'axios';

interface CreateDatasetPayload {
  name: string;
  description?: string;
}

export interface DatasetSection {
  id: string;
  datasetId: string;
  type: 'tasks' | 'data-table' | 'data-chart' | 'data-cards' | 'text';
  title: string;
  config: Record<string, unknown>;
  order: number;
}

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  sections: DatasetSection[];
  status?: 'DRAFT' | 'PUBLISHED';
}

export interface DatasetWithData {
  dataset: Dataset;
  data: Record<string, unknown>;
}

class DatasetService {
  async createDataset(data: CreateDatasetPayload): Promise<Dataset> {
    const response = await axios.post<{ success: true; data: Dataset }>('/datasets', data);
    return response.data.data;
  }

  async listDatasets(): Promise<Dataset[]> {
    const response = await axios.get<{ success: true; data: Dataset[] }>('/datasets');
    return response.data.data;
  }

  async deleteDataset(id: string): Promise<void> {
    await axios.delete(`/datasets/${id}`);
  }

  async getDataset(id: string): Promise<Dataset> {
    const response = await axios.get<{ success: true; data: Dataset }>(`/datasets/${id}`);
    return response.data.data;
  }

  async addSection(datasetId: string, section: Partial<DatasetSection>): Promise<Dataset> {
    const response = await axios.post<{ success: true; data: Dataset }>(
      `/datasets/${datasetId}/sections`,
      section
    );
    return response.data.data;
  }

  async updateSection(
    datasetId: string,
    sectionId: string,
    data: Partial<DatasetSection>
  ): Promise<Dataset> {
    const response = await axios.put<{ success: true; data: Dataset }>(
      `/datasets/${datasetId}/sections/${sectionId}`,
      data
    );
    return response.data.data;
  }

  async deleteSection(datasetId: string, sectionId: string): Promise<void> {
    await axios.delete(`/datasets/${datasetId}/sections/${sectionId}`);
  }

  async reorderSections(datasetId: string, sectionIds: string[]): Promise<Dataset> {
    const response = await axios.put<{ success: true; data: Dataset }>(
      `/datasets/${datasetId}/sections/reorder`,
      { sectionIds }
    );
    return response.data.data;
  }

  async getDatasetWithData(id: string): Promise<DatasetWithData> {
    const response = await axios.get<{ success: true; data: DatasetWithData }>(
      `/datasets/${id}/data`
    );
    return response.data.data;
  }

  async publishDataset(id: string): Promise<void> {
    await axios.post(`/datasets/${id}/publish`);
  }
}

export const datasetService = new DatasetService();


