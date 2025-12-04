export interface IAuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  changes?: any;
  metadata: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  timestamp: Date;
}

export interface IAuditLogFilters {
  companyId: string;
  entity?: string;
  entityId?: string;
  action?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface IAuditLogListResponse {
  logs: any[]; // Transformed to match frontend format
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}


