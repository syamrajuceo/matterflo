import axios from 'axios';
import type {
  IClientDashboardStats,
  IClientFlowInstance,
  IClientPendingTasksResponse,
  IClientTask,
  IClientTaskCompletionRequest,
  IClientTaskExecution,
  IGetMyTasksParams,
} from './client.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ClientService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<IClientDashboardStats> {
    const response = await axios.get<{ success: boolean; data: IClientDashboardStats }>(
      `${API_URL}/client/dashboard`
    );
    return response.data.data;
  }

  /**
   * Get my pending tasks
   */
  async getMyTasks(params?: IGetMyTasksParams): Promise<IClientPendingTasksResponse> {
    const response = await axios.get<{ success: boolean; data: IClientPendingTasksResponse }>(
      `${API_URL}/client/tasks`,
      { params }
    );
    return response.data.data;
  }

  /**
   * Get task execution details
   */
  async getTask(taskId: string): Promise<IClientTaskExecution> {
    const response = await axios.get<{ success: boolean; data: IClientTaskExecution }>(
      `${API_URL}/client/tasks/${taskId}`
    );
    return response.data.data;
  }

  /**
   * Submit task completion
   */
  async submitTask(taskId: string, data: IClientTaskCompletionRequest): Promise<void> {
    await axios.post(`${API_URL}/client/tasks/${taskId}/complete`, data);
  }

  /**
   * Get my flow instances
   */
  async getMyFlows(): Promise<IClientFlowInstance[]> {
    const response = await axios.get<{ success: boolean; data: { flows: IClientFlowInstance[] } }>(
      `${API_URL}/client/flows`
    );
    return response.data.data.flows;
  }

  /**
   * Get flow instance details
   */
  async getFlowInstance(flowInstanceId: string): Promise<IClientFlowInstance> {
    const response = await axios.get<{ success: boolean; data: IClientFlowInstance }>(
      `${API_URL}/client/flows/${flowInstanceId}`
    );
    return response.data.data;
  }
}

export const clientService = new ClientService();
