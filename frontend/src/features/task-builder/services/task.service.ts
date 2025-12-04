import axios from 'axios';
import type { ITask, ITaskField, ICreateTaskRequest, IUpdateTaskRequest, IListTasksParams, IListTasksResponse } from '../types/task.types';

// Axios is configured in auth.service.ts with baseURL and interceptors
// Use relative paths to leverage the configured baseURL
class TaskService {
  async createTask(data: ICreateTaskRequest): Promise<ITask> {
    const response = await axios.post<{ success: true; data: ITask }>('/tasks', data);
    return response.data.data;
  }

  async listTasks(params?: IListTasksParams): Promise<IListTasksResponse> {
    const response = await axios.get<{ success: true; data: IListTasksResponse }>('/tasks', { params });
    return response.data.data;
  }

  async getTask(id: string): Promise<ITask> {
    const response = await axios.get<{ success: true; data: ITask }>(`/tasks/${id}`);
    return response.data.data;
  }

  async updateTask(id: string, data: IUpdateTaskRequest): Promise<ITask> {
    const response = await axios.put<{ success: true; data: ITask }>(`/tasks/${id}`, data);
    return response.data.data;
  }

  async addField(taskId: string, field: Partial<ITaskField>): Promise<ITask> {
    const response = await axios.post<{ success: true; data: ITask }>(`/tasks/${taskId}/fields`, field);
    return response.data.data;
  }

  async updateField(taskId: string, fieldId: string, data: Partial<ITaskField>): Promise<ITask> {
    const response = await axios.put<{ success: true; data: ITask }>(`/tasks/${taskId}/fields/${fieldId}`, data);
    return response.data.data;
  }

  async deleteField(taskId: string, fieldId: string): Promise<ITask> {
    const response = await axios.delete<{ success: true; data: ITask }>(`/tasks/${taskId}/fields/${fieldId}`);
    return response.data.data;
  }

  async reorderFields(taskId: string, fieldIds: string[]): Promise<ITask> {
    const response = await axios.put<{ success: true; data: ITask }>(`/tasks/${taskId}/fields/reorder`, { fieldIds });
    return response.data.data;
  }

  async publishTask(id: string): Promise<ITask> {
    const response = await axios.post<{ success: true; data: ITask }>(`/tasks/${id}/publish`);
    return response.data.data;
  }

  async deleteTask(id: string): Promise<void> {
    await axios.delete(`/tasks/${id}`);
  }

  async duplicateTask(id: string, name: string): Promise<ITask> {
    const response = await axios.post<{ success: true; data: ITask }>(`/tasks/${id}/duplicate`, { name });
    return response.data.data;
  }
}

export const taskService = new TaskService();

