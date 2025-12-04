import { Request, Response, NextFunction } from 'express';
import { datasetService } from './dataset.service';
import { errorHandler } from '../../common/middleware/error.middleware';

class DatasetController {
  // POST /api/datasets
  async createDataset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user || !user.companyId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'User must be associated with a company',
          },
        });
        return;
      }

      const dataset = await datasetService.createDataset({
        ...req.body,
        companyId: user.companyId,
      });

      res.status(201).json({
        success: true,
        data: dataset,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/datasets
  async listDatasets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user || !user.companyId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'User must be associated with a company',
          },
        });
        return;
      }

      const datasets = await datasetService.listDatasets(user.companyId);

      res.json({
        success: true,
        data: datasets,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/datasets/:id
  async getDataset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const dataset = await datasetService.getDataset(id);

      if (!dataset) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Dataset not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: dataset,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/datasets/:id
  async updateDataset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const dataset = await datasetService.updateDataset(id, req.body);

      res.json({
        success: true,
        data: dataset,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/datasets/:id
  async deleteDataset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await datasetService.deleteDataset(id);

      res.json({
        success: true,
        message: 'Dataset deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/datasets/:id/sections
  async addSection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const dataset = await datasetService.addSection(id, req.body);

      res.status(201).json({
        success: true,
        data: dataset,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/datasets/:id/sections/:sectionId
  async updateSection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, sectionId } = req.params;
      const dataset = await datasetService.updateSection(id, sectionId, req.body);

      res.json({
        success: true,
        data: dataset,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/datasets/:id/sections/:sectionId
  async deleteSection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, sectionId } = req.params;
      const dataset = await datasetService.deleteSection(id, sectionId);

      res.json({
        success: true,
        data: dataset,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/datasets/:id/sections/reorder
  async reorderSections(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { sectionIds } = req.body;
      const dataset = await datasetService.reorderSections(id, sectionIds);

      res.json({
        success: true,
        data: dataset,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/datasets/:id/data
  async getDatasetWithData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const userRole = user?.role;

      if (!user || !user.id) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'User authentication required',
          },
        });
        return;
      }

      const result = await datasetService.getDatasetWithData(id, user.id, userRole);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/datasets/:id/publish
  async publishDataset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const dataset = await datasetService.publishDataset(id);

      res.json({
        success: true,
        data: dataset,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const datasetController = new DatasetController();

