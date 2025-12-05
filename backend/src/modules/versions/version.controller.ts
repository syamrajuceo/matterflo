import { Request, Response, NextFunction } from 'express';
import { versionService } from './version.service';
import { successResponse } from '../../common/utils/response';

class VersionController {
  // POST /api/versions
  createVersion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
        });
      }

      const { entityType, entityId, changes } = req.body;

      if (!entityType || !entityId) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'entityType and entityId are required' },
        });
      }

      const version = await versionService.createVersion(
        entityType,
        entityId,
        req.user.id,
        changes
      );

      res.status(201).json(successResponse(version));
    } catch (error) {
      next(error);
    }
  };

  // GET /api/versions/:entityType/:entityId
  getVersionHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { entityType, entityId } = req.params;

      const versions = await versionService.getVersionHistory(entityType, entityId);
      res.json(successResponse(versions));
    } catch (error) {
      next(error);
    }
  };

  // POST /api/versions/:id/publish
  publishVersion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const version = await versionService.publishVersion(id);
      res.json(successResponse(version));
    } catch (error) {
      next(error);
    }
  };

  // POST /api/versions/:id/rollback
  rollbackVersion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
        });
      }

      const { id } = req.params;
      const result = await versionService.rollbackVersion(id, req.user.id);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/versions/:id/rollout
  updateRollout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { percentage, companyIds, autoProgress } = req.body;

      const version = await versionService.updateRollout(id, {
        percentage,
        companyIds,
        autoProgress,
      });

      res.json(successResponse(version));
    } catch (error) {
      next(error);
    }
  };

  // GET /api/versions/:id/rollout
  getRolloutStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const status = await versionService.getRolloutStatus(id);
      res.json(successResponse(status));
    } catch (error) {
      next(error);
    }
  };

  // POST /api/versions/:id/rollout/progress
  progressRollout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const version = await versionService.progressRollout(id);
      res.json(successResponse(version));
    } catch (error) {
      next(error);
    }
  };
}

export const versionController = new VersionController();

