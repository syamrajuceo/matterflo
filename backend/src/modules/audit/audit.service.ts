import { prisma } from '../../common/config/database.config';
import { stringify } from 'csv-stringify/sync';
import type { IAuditLog, IAuditLogFilters, IAuditLogListResponse } from './audit.types';

class AuditService {
  private mapToIAuditLog(log: any): any {
    // Transform backend format to frontend format
    const levelMap: Record<string, string> = {
      WARNING: 'WARN',
      INFO: 'INFO',
      ERROR: 'ERROR',
      CRITICAL: 'CRITICAL',
    };

    // Construct user name from firstName and lastName
    const userName = log.user
      ? log.user.firstName || log.user.lastName
        ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim()
        : log.user.email
      : undefined;

    return {
      id: log.id,
      userId: log.userId,
      user: log.user
        ? {
            id: log.user.id,
            email: log.user.email,
            name: userName || log.user.email,
          }
        : undefined,
      entityType: log.entity, // Map entity to entityType
      entityId: log.entityId,
      action: log.action,
      level: levelMap[log.level] || log.level, // Map WARNING to WARN
      message: log.metadata?.message || `${log.action} ${log.entity}${log.entityId ? ` (${log.entityId})` : ''}`,
      changes: log.changes ?? undefined,
      metadata: {
        ...(log.metadata as any),
        ip: log.ipAddress,
        userAgent: log.userAgent,
      },
      createdAt: log.timestamp.toISOString(), // Map timestamp to createdAt
    };
  }

  async getLogs(filters: IAuditLogFilters): Promise<IAuditLogListResponse> {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 200) : 50;
    const skip = (page - 1) * limit;

    const where: any = {
      // Filter by company via user relation
      user: {
        companyId: filters.companyId,
      },
    };

    if (filters.entity) {
      where.entity = filters.entity;
    }
    if (filters.entityId) {
      where.entityId = filters.entityId;
    }
    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp.lte = filters.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const mapped = logs.map((l) => this.mapToIAuditLog(l));

    return {
      logs: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async exportLogsCSV(filters: IAuditLogFilters): Promise<string> {
    // For export, ignore pagination and fetch a reasonable maximum
    const where: any = {
      user: {
        companyId: filters.companyId,
      },
    };

    if (filters.entity) {
      where.entity = filters.entity;
    }
    if (filters.entityId) {
      where.entityId = filters.entityId;
    }
    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp.lte = filters.endDate;
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 5000, // hard cap for export
    });

    const rows = logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      level: log.level,
      timestamp: log.timestamp.toISOString(),
      ipAddress: log.ipAddress ?? '',
      userAgent: log.userAgent ?? '',
      metadata: JSON.stringify(log.metadata || {}),
      changes: log.changes ? JSON.stringify(log.changes) : '',
    }));

    const headers = [
      'id',
      'userId',
      'action',
      'entity',
      'entityId',
      'level',
      'timestamp',
      'ipAddress',
      'userAgent',
      'metadata',
      'changes',
    ];

    const csv = stringify(rows, {
      header: true,
      columns: headers,
    });

    return csv;
  }

  /**
   * Create an audit log entry
   */
  async createLog(data: {
    userId: string;
    action: string;
    entity: string;
    entityId?: string | null;
    level?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    message?: string;
    changes?: any;
    metadata?: Record<string, any>;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<IAuditLog> {
    const log = await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        // Prisma schema requires a non-null string for entityId, so fall back to empty string
        entityId: data.entityId ?? '',
        level: data.level || 'INFO',
        metadata: data.metadata || {},
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        timestamp: new Date(),
      },
    });

    return this.mapToIAuditLog(log);
  }
}

export const auditService = new AuditService();


