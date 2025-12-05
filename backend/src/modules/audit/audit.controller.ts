import { Request, Response, NextFunction } from 'express';
import { auditService } from './audit.service';
import { successResponse } from '../../common/utils/response';
import { prisma } from '../../common/config/database.config';
import { getCompanyIdForUser } from '../../common/utils/company-helper';

class AuditController {
  // GET /api/audit/logs
  async getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTH_ERROR', message: 'Not authenticated' },
        });
        return;
      }

      const {
        entity,
        entityId,
        action,
        userId,
        startDate,
        endDate,
        page = '1',
        limit = '50',
      } = req.query;

      const companyId = await getCompanyIdForUser(user, req);
      if (!companyId) {
        res.status(400).json({
          success: false,
          error: { 
            code: 'COMPANY_REQUIRED', 
            message: user.role === 'DEVELOPER' 
              ? 'Please select a company or provide x-company-id header'
              : 'User must be associated with a company' 
          },
        });
        return;
      }

      const logs = await auditService.getLogs({
        companyId,
        entity: entity as string | undefined,
        entityId: entityId as string | undefined,
        action: action as string | undefined,
        userId: userId as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      });

      res.json(successResponse(logs));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/audit/logs/export
  async exportLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTH_ERROR', message: 'Not authenticated' },
        });
        return;
      }

      const { entity, entityId, action, userId, startDate, endDate } = req.query;
      
      const companyId = await getCompanyIdForUser(user, req);
      if (!companyId) {
        res.status(400).json({
          success: false,
          error: { 
            code: 'COMPANY_REQUIRED', 
            message: user.role === 'DEVELOPER' 
              ? 'Please select a company or provide x-company-id header'
              : 'User must be associated with a company' 
          },
        });
        return;
      }

      const csv = await auditService.exportLogsCSV({
        companyId,
        entity: entity as string | undefined,
        entityId: entityId as string | undefined,
        action: action as string | undefined,
        userId: userId as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/audit/logs/test - Create test audit logs for testing purposes
  async createTestLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTH_ERROR', message: 'Not authenticated' },
        });
        return;
      }

      const userId = user.id;
      const companyId = await getCompanyIdForUser(user, req);
      if (!companyId) {
        res.status(400).json({
          success: false,
          error: { 
            code: 'COMPANY_REQUIRED', 
            message: user.role === 'DEVELOPER' 
              ? 'Please select a company or provide x-company-id header'
              : 'User must be associated with a company' 
          },
        });
        return;
      }

      // For DEVELOPER users, skip company verification
      // For other users, verify they belong to the company
      if (user.role !== 'DEVELOPER') {
        const dbUser = await prisma.user.findUnique({
        where: { id: userId },
      });

        if (!dbUser || dbUser.companyId !== companyId) {
        res.status(403).json({ success: false, error: { message: 'Unauthorized' } });
        return;
        }
      }

      const testLogs = [
        {
          userId,
          action: 'created',
          entity: 'Task',
          entityId: 'test-task-1',
          level: 'INFO' as const,
          message: 'Created task "Test Task 1"',
          changes: { name: 'Test Task 1', status: 'DRAFT' },
        },
        {
          userId,
          action: 'updated',
          entity: 'Task',
          entityId: 'test-task-1',
          level: 'INFO' as const,
          message: 'Updated task "Test Task 1"',
          changes: { before: { status: 'DRAFT' }, after: { status: 'PUBLISHED' } },
        },
        {
          userId,
          action: 'created',
          entity: 'Flow',
          entityId: 'test-flow-1',
          level: 'INFO' as const,
          message: 'Created flow "Test Flow 1"',
        },
        {
          userId,
          action: 'deleted',
          entity: 'Task',
          entityId: 'test-task-2',
          level: 'WARNING' as const,
          message: 'Deleted task "Test Task 2"',
        },
        {
          userId,
          action: 'executed',
          entity: 'Trigger',
          entityId: 'test-trigger-1',
          level: 'ERROR' as const,
          message: 'Trigger execution failed',
          metadata: { error: 'Connection timeout' },
        },
      ];

      const createdLogs = [];
      for (const logData of testLogs) {
        const log = await auditService.createLog({
          ...logData,
          ipAddress: req.ip || null,
          userAgent: req.get('user-agent') || null,
        });
        createdLogs.push(log);
      }

      res.json(successResponse({ logs: createdLogs, count: createdLogs.length }));
    } catch (error) {
      next(error);
    }
  }
}

export const auditController = new AuditController();


