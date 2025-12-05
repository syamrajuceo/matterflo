import { Request, Response, NextFunction } from 'express';
import { exportService } from './export.service';
import { successResponse } from '../../common/utils/response';

class ExportController {
  // GET /api/export/:companyId
  exportCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
        });
      }

      const { companyId } = req.params;
      const exportPackage = await exportService.generateExport(companyId);
      
      res.json(successResponse(exportPackage));
    } catch (error) {
      next(error);
    }
  };

  // GET /api/export/:companyId/download
  downloadExport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
        });
      }

      const { companyId } = req.params;
      const jsonData = await exportService.generateExportJSON(companyId);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="erp-export-${companyId}-${Date.now()}.json"`);
      res.send(jsonData);
    } catch (error) {
      next(error);
    }
  };
}

export const exportController = new ExportController();

