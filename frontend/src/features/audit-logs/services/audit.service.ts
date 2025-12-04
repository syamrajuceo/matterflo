import axios from 'axios';

// Axios is configured in auth.service.ts with baseURL and interceptors
// Use relative paths to leverage the configured baseURL

export interface IAuditLog {
  id: string;
  userId: string | null;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  entityType: string;
  entityId: string | null;
  action: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  message: string;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata?: {
    ip?: string;
    userAgent?: string;
    requestId?: string;
  };
  createdAt: string;
}

export interface IGetLogsParams {
  entity?: string; // Backend expects 'entity', not 'entityType'
  entityId?: string;
  action?: string;
  userId?: string;
  level?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IGetLogsResponse {
  logs: IAuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class AuditService {
  async getLogs(params?: IGetLogsParams): Promise<IGetLogsResponse> {
    const response = await axios.get<{ success: true; data: IGetLogsResponse }>(
      '/audit/logs',
      { params }
    );
    return response.data.data;
  }

  async getLogDetails(id: string): Promise<IAuditLog> {
    const response = await axios.get<{ success: true; data: IAuditLog }>(
      `/audit/logs/${id}`
    );
    return response.data.data;
  }

  async exportLogs(params?: IGetLogsParams): Promise<Blob> {
    const response = await axios.get('/audit/logs/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }
}

export const auditService = new AuditService();

