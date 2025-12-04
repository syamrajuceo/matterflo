import axios from 'axios';
import type {
  IFlow,
  ICreateFlowRequest,
  IUpdateFlowRequest,
  ICreateFlowLevelRequest,
  IUpdateFlowLevelRequest,
  ICreateFlowBranchRequest,
  IUpdateFlowBranchRequest,
  IAddTaskToLevelRequest,
  IListFlowsParams,
  IListFlowsResponse,
} from '../types/flow.types';

// Axios is configured in auth.service.ts with baseURL and interceptors
// Use relative paths to leverage the configured baseURL
class FlowService {
  // Flow CRUD
  async createFlow(data: ICreateFlowRequest): Promise<IFlow> {
    const response = await axios.post<{ success: true; data: IFlow }>('/flows', data);
    return response.data.data;
  }

  async listFlows(params?: IListFlowsParams): Promise<IListFlowsResponse> {
    const response = await axios.get<{ success: true; data: IListFlowsResponse }>('/flows', { params });
    return response.data.data;
  }

  async getFlow(id: string): Promise<IFlow> {
    const response = await axios.get<{ success: true; data: IFlow }>(`/flows/${id}`);
    return response.data.data;
  }

  async updateFlow(id: string, data: IUpdateFlowRequest): Promise<IFlow> {
    const response = await axios.put<{ success: true; data: IFlow }>(`/flows/${id}`, data);
    return response.data.data;
  }

  async deleteFlow(id: string): Promise<void> {
    await axios.delete(`/flows/${id}`);
  }

  async publishFlow(id: string): Promise<IFlow> {
    const response = await axios.post<{ success: true; data: IFlow }>(`/flows/${id}/publish`);
    return response.data.data;
  }

  async duplicateFlow(id: string, name: string): Promise<IFlow> {
    const response = await axios.post<{ success: true; data: IFlow }>(`/flows/${id}/duplicate`, { name });
    return response.data.data;
  }

  // Flow Level operations
  async addLevel(flowId: string, data: ICreateFlowLevelRequest): Promise<IFlow> {
    const response = await axios.post<{ success: true; data: IFlow }>(`/flows/${flowId}/levels`, data);
    return response.data.data;
  }

  async updateLevel(flowId: string, levelId: string, data: IUpdateFlowLevelRequest): Promise<IFlow> {
    const response = await axios.put<{ success: true; data: IFlow }>(`/flows/${flowId}/levels/${levelId}`, data);
    return response.data.data;
  }

  async deleteLevel(flowId: string, levelId: string): Promise<IFlow> {
    const response = await axios.delete<{ success: true; data: IFlow }>(`/flows/${flowId}/levels/${levelId}`);
    return response.data.data;
  }

  async reorderLevels(flowId: string, levelIds: string[]): Promise<IFlow> {
    const response = await axios.put<{ success: true; data: IFlow }>(`/flows/${flowId}/levels/reorder`, { levelIds });
    return response.data.data;
  }

  // Task assignment to level
  async addTaskToLevel(flowId: string, levelId: string, data: IAddTaskToLevelRequest): Promise<IFlow> {
    const response = await axios.post<{ success: true; data: IFlow }>(`/flows/${flowId}/levels/${levelId}/tasks`, data);
    return response.data.data;
  }

  async removeTaskFromLevel(flowId: string, levelId: string, taskId: string): Promise<IFlow> {
    const response = await axios.delete<{ success: true; data: IFlow }>(`/flows/${flowId}/levels/${levelId}/tasks/${taskId}`);
    return response.data.data;
  }

  async reorderTasksInLevel(flowId: string, levelId: string, taskIds: string[]): Promise<IFlow> {
    const response = await axios.put<{ success: true; data: IFlow }>(`/flows/${flowId}/levels/${levelId}/tasks/reorder`, { taskIds });
    return response.data.data;
  }

  // Role assignment to level
  async addRoleToLevel(flowId: string, levelId: string, roleId: string): Promise<IFlow> {
    const response = await axios.post<{ success: true; data: IFlow }>(`/flows/${flowId}/levels/${levelId}/roles`, { roleId });
    return response.data.data;
  }

  async removeRoleFromLevel(flowId: string, levelId: string, roleId: string): Promise<IFlow> {
    const response = await axios.delete<{ success: true; data: IFlow }>(`/flows/${flowId}/levels/${levelId}/roles/${roleId}`);
    return response.data.data;
  }

  // Flow Branch operations
  async createBranch(flowId: string, data: ICreateFlowBranchRequest): Promise<IFlow> {
    const response = await axios.post<{ success: true; data: IFlow }>(`/flows/${flowId}/branches`, data);
    return response.data.data;
  }

  async updateBranch(flowId: string, branchId: string, data: IUpdateFlowBranchRequest): Promise<IFlow> {
    const response = await axios.put<{ success: true; data: IFlow }>(`/flows/${flowId}/branches/${branchId}`, data);
    return response.data.data;
  }

  async deleteBranch(flowId: string, branchId: string): Promise<IFlow> {
    const response = await axios.delete<{ success: true; data: IFlow }>(`/flows/${flowId}/branches/${branchId}`);
    return response.data.data;
  }
}

export const flowService = new FlowService();

