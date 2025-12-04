import axios from 'axios';
import type {
  ICustomTable,
  ITableRecord,
  ITableField,
  ICreateTableRequest,
  IUpdateTableRequest,
  IQueryRecordsParams,
  IQueryRecordsResponse,
} from '../types/database.types';

class DatabaseService {
  // Tables
  async createTable(data: ICreateTableRequest): Promise<ICustomTable> {
    const response = await axios.post<{ success: true; data: ICustomTable }>('/database', data);
    return response.data.data;
  }

  async listTables(): Promise<ICustomTable[]> {
    const response = await axios.get<{ success: true; data: ICustomTable[] }>('/database');
    return response.data.data;
  }

  async getTable(id: string): Promise<ICustomTable> {
    const response = await axios.get<{ success: true; data: ICustomTable }>(`/database/${id}`);
    return response.data.data;
  }

  async updateTable(id: string, data: IUpdateTableRequest): Promise<ICustomTable> {
    const response = await axios.put<{ success: true; data: ICustomTable }>(`/database/${id}`, data);
    return response.data.data;
  }

  async deleteTable(id: string): Promise<void> {
    await axios.delete(`/database/${id}`);
  }

  // Fields
  async addField(tableId: string, field: Partial<ITableField>): Promise<ICustomTable> {
    const response = await axios.post<{ success: true; data: ICustomTable }>(
      `/database/${tableId}/fields`,
      field
    );
    return response.data.data;
  }

  async updateField(tableId: string, fieldId: string, data: Partial<ITableField>): Promise<ICustomTable> {
    const response = await axios.put<{ success: true; data: ICustomTable }>(
      `/database/${tableId}/fields/${fieldId}`,
      data
    );
    return response.data.data;
  }

  async deleteField(tableId: string, fieldId: string): Promise<ICustomTable> {
    const response = await axios.delete<{ success: true; data: ICustomTable }>(
      `/database/${tableId}/fields/${fieldId}`
    );
    return response.data.data;
  }

  async reorderFields(tableId: string, fieldIds: string[]): Promise<ICustomTable> {
    const response = await axios.put<{ success: true; data: ICustomTable }>(
      `/database/${tableId}/fields/reorder`,
      { fieldIds }
    );
    return response.data.data;
  }

  // Records
  async insertRecord(tableId: string, data: Record<string, any>): Promise<ITableRecord> {
    const response = await axios.post<{ success: true; data: any }>(
      `/database/${tableId}/records`,
      data
    );
    // Transform record: backend returns data fields spread at top level
    const { id, createdAt, updatedAt, createdBy, updatedBy, ...recordData } = response.data.data;
    return {
      id,
      tableId,
      data: recordData,
      createdAt,
      updatedAt,
      createdBy,
      updatedBy,
    } as ITableRecord;
  }

  async queryRecords(tableId: string, params?: IQueryRecordsParams): Promise<IQueryRecordsResponse> {
    const response = await axios.get<{ success: true; data: IQueryRecordsResponse }>(
      `/database/${tableId}/records`,
      { params }
    );
    // Transform records: backend returns data fields spread at top level,
    // but frontend expects them nested under `data` property
    const transformedResponse = {
      ...response.data.data,
      records: response.data.data.records.map((record: any) => {
        // Extract id, createdAt, updatedAt, and everything else goes into data
        const { id, createdAt, updatedAt, createdBy, updatedBy, ...data } = record;
        return {
          id,
          tableId,
          data,
          createdAt,
          updatedAt,
          createdBy,
          updatedBy,
        } as ITableRecord;
      }),
    };
    return transformedResponse;
  }

  async getRecord(tableId: string, recordId: string): Promise<ITableRecord> {
    const response = await axios.get<{ success: true; data: any }>(
      `/database/${tableId}/records/${recordId}`
    );
    // Transform record: backend returns data fields spread at top level
    const { id, createdAt, updatedAt, createdBy, updatedBy, ...recordData } = response.data.data;
    return {
      id,
      tableId,
      data: recordData,
      createdAt,
      updatedAt,
      createdBy,
      updatedBy,
    } as ITableRecord;
  }

  async updateRecord(tableId: string, recordId: string, data: Record<string, any>): Promise<ITableRecord> {
    const response = await axios.put<{ success: true; data: any }>(
      `/database/${tableId}/records/${recordId}`,
      data
    );
    // Transform record: backend returns data fields spread at top level
    const { id, createdAt, updatedAt, createdBy, updatedBy, ...recordData } = response.data.data;
    return {
      id,
      tableId,
      data: recordData,
      createdAt,
      updatedAt,
      createdBy,
      updatedBy,
    } as ITableRecord;
  }

  async deleteRecord(tableId: string, recordId: string): Promise<void> {
    await axios.delete(`/database/${tableId}/records/${recordId}`);
  }

  // Import/Export
  async importCSV(tableId: string, file: File): Promise<{ imported: number; errors: any[] }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post<{ success: true; data: { imported: number; errors: any[] } }>(
      `/database/${tableId}/import`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  }

  async exportCSV(tableId: string): Promise<Blob> {
    const response = await axios.get(`/database/${tableId}/export`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export const databaseService = new DatabaseService();

