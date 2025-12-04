import axios from 'axios';
import type {
  ITrigger,
  ITriggerExecution,
  ICreateTriggerRequest,
  IUpdateTriggerRequest,
  IListTriggersParams,
} from '../types/trigger.types';

class TriggerService {
  async createTrigger(data: ICreateTriggerRequest): Promise<ITrigger> {
    // If levelId is provided, include it in eventConfig
    const eventConfig = data.levelId
      ? { ...data.eventConfig, levelId: data.levelId }
      : data.eventConfig || {};

    const response = await axios.post<{ success: true; data: ITrigger }>('/triggers', {
      ...data,
      eventConfig,
    });
    return response.data.data;
  }

  async listTriggers(params?: IListTriggersParams): Promise<ITrigger[]> {
    const response = await axios.get<{ success: true; data: ITrigger[] }>('/triggers', { params });
    // Ensure we always return an array
    return Array.isArray(response.data.data) ? response.data.data : [];
  }

  async getTrigger(id: string): Promise<ITrigger> {
    const response = await axios.get<{ success: true; data: ITrigger }>(`/triggers/${id}`);
    return response.data.data;
  }

  async updateTrigger(id: string, data: IUpdateTriggerRequest): Promise<ITrigger> {
    const response = await axios.put<{ success: true; data: ITrigger }>(`/triggers/${id}`, data);
    return response.data.data;
  }

  async deleteTrigger(id: string): Promise<void> {
    await axios.delete(`/triggers/${id}`);
  }

  async testTrigger(id: string): Promise<ITriggerExecution> {
    const response = await axios.post<{ success: true; data: ITriggerExecution }>(`/triggers/${id}/test`);
    return response.data.data;
  }

  async getTriggerExecutions(id: string): Promise<ITriggerExecution[]> {
    const response = await axios.get<{ success: true; data: ITriggerExecution[] }>(`/triggers/${id}/executions`);
    return response.data.data;
  }
}

export const triggerService = new TriggerService();

