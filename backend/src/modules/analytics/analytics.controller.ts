import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';
import { successResponse } from '../../common/utils/response';
import type { AnalyticsFilters } from './analytics.types';

class AnalyticsController {
  /**
   * Get dashboard statistics
   * GET /api/analytics/dashboard
   */
  getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId!;
      const filters: AnalyticsFilters = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        departmentId: req.query.departmentId as string | undefined,
        roleId: req.query.roleId as string | undefined,
        userId: req.query.userId as string | undefined,
      };

      const stats = await analyticsService.getDashboardStats(companyId, filters);
      res.json(successResponse(stats));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get task analytics
   * GET /api/analytics/tasks
   */
  getTaskAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId!;
      const filters: AnalyticsFilters = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        taskId: req.query.taskId as string | undefined,
        departmentId: req.query.departmentId as string | undefined,
        roleId: req.query.roleId as string | undefined,
        userId: req.query.userId as string | undefined,
      };

      const analytics = await analyticsService.getTaskAnalytics(companyId, filters);
      res.json(successResponse(analytics));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get flow analytics
   * GET /api/analytics/flows
   */
  getFlowAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId!;
      const filters: AnalyticsFilters = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        flowId: req.query.flowId as string | undefined,
        departmentId: req.query.departmentId as string | undefined,
        roleId: req.query.roleId as string | undefined,
        userId: req.query.userId as string | undefined,
      };

      const analytics = await analyticsService.getFlowAnalytics(companyId, filters);
      res.json(successResponse(analytics));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user activity analytics
   * GET /api/analytics/users
   */
  getUserActivityAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId!;
      const filters: AnalyticsFilters = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        departmentId: req.query.departmentId as string | undefined,
        roleId: req.query.roleId as string | undefined,
        userId: req.query.userId as string | undefined,
      };

      const analytics = await analyticsService.getUserActivityAnalytics(companyId, filters);
      res.json(successResponse(analytics));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get company analytics
   * GET /api/analytics/company
   */
  getCompanyAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId!;
      const analytics = await analyticsService.getCompanyAnalytics(companyId);
      res.json(successResponse(analytics));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get performance metrics
   * GET /api/analytics/performance
   */
  getPerformanceMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId!;
      const filters: AnalyticsFilters = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        departmentId: req.query.departmentId as string | undefined,
        roleId: req.query.roleId as string | undefined,
      };

      const metrics = await analyticsService.getPerformanceMetrics(companyId, filters);
      res.json(successResponse(metrics));
    } catch (error) {
      next(error);
    }
  };
}

export const analyticsController = new AnalyticsController();

