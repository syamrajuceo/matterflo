import { apiClient, extractApiData, type ApiResponse, type PaginationParams, type ListResponse } from '@/lib/api-client';

// Types
export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'PUBLISH' 
  | 'ARCHIVE' 
  | 'ASSIGN' 
  | 'COMPLETE';

export type AuditEntityType = 
  | 'TASK' 
  | 'FLOW' 
  | 'TRIGGER' 
  | 'DATABASE' 
  | 'DATASET' 
  | 'USER' 
  | 'ROLE' 
  | 'DEPARTMENT';

export interface AuditLog {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityName?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface ListAuditLogsParams extends PaginationParams {
  entity?: AuditEntityType;
  entityId?: string;
  action?: AuditAction;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

// API functions
export const auditApi = {
  /**
   * Get audit logs
   * GET /api/audit/logs
   */
  getLogs: async (params?: ListAuditLogsParams): Promise<ListResponse<AuditLog>> => {
    const response = await apiClient.get<ApiResponse<ListResponse<AuditLog>>>('/audit/logs', { params });
    return extractApiData(response);
  },

  /**
   * Export audit logs as CSV
   * GET /api/audit/logs/export
   */
  exportLogs: async (params?: ListAuditLogsParams): Promise<Blob> => {
    const response = await apiClient.get('/audit/logs/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

