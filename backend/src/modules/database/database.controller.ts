import { Request, Response, NextFunction } from 'express';
import { databaseService } from './database.service';
import { successResponse } from '../../common/utils/response';

class DatabaseController {
  // POST /api/database/tables
  createTable = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, displayName, description } = req.body;
      const companyId = req.user!.companyId!;

      const table = await databaseService.createTable({
        name,
        displayName,
        description,
        companyId,
      });

      res.status(201).json(successResponse(table, 'Table created successfully'));
    } catch (error) {
      next(error);
    }
  };

  // GET /api/database/tables
  listTables = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId!;
      const tables = await databaseService.listTables(companyId);

      res.json(successResponse(tables));
    } catch (error) {
      next(error);
    }
  };

  // GET /api/database/tables/:id
  getTable = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const table = await databaseService.getTable(id);

      if (!table) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Table not found' },
        });
      }

      res.json(successResponse(table));
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/database/tables/:id
  updateTable = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { displayName, description } = req.body;

      // For now, we'll just update the table metadata
      // Full update would require updating the Prisma model
      const table = await databaseService.getTable(id);
      if (!table) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Table not found' },
        });
      }

      // Update via Prisma directly (we can add this to service later)
      const { prisma } = require('../../common/config/database.config');
      const updated = await prisma.customTable.update({
        where: { id },
        data: {
          displayName: displayName || table.displayName,
          description: description !== undefined ? description : table.description,
        },
      });

      res.json(successResponse(updated, 'Table updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  // POST /api/database/tables/:id/fields
  addField = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const table = await databaseService.addField(id, req.body);

      res.json(successResponse(table, 'Field added successfully'));
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/database/tables/:id/fields/:fieldId
  updateField = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, fieldId } = req.params;
      const table = await databaseService.updateField(id, fieldId, req.body);

      res.json(successResponse(table, 'Field updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/database/tables/:id/fields/:fieldId
  deleteField = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, fieldId } = req.params;
      const table = await databaseService.deleteField(id, fieldId);

      res.json(successResponse(table, 'Field deleted successfully'));
    } catch (error) {
      next(error);
    }
  };

  // POST /api/database/tables/:id/relations
  createRelation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const table = await databaseService.createRelation(id, req.body);

      res.status(201).json(successResponse(table, 'Relation created successfully'));
    } catch (error) {
      next(error);
    }
  };

  // POST /api/database/tables/:id/records
  insertRecord = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const record = await databaseService.insertRecord(id, req.body, userId);

      res.status(201).json(successResponse(record, 'Record inserted successfully'));
    } catch (error) {
      next(error);
    }
  };

  // GET /api/database/tables/:id/records
  queryRecords = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const options = {
        filters: req.query.filters
          ? typeof req.query.filters === 'string'
            ? JSON.parse(req.query.filters)
            : req.query.filters
          : undefined,
        sort: req.query.sort
          ? typeof req.query.sort === 'string'
            ? JSON.parse(req.query.sort)
            : req.query.sort
          : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      const result = await databaseService.queryRecords(id, options);

      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/database/tables/:id/records/:recordId
  updateRecord = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, recordId } = req.params;
      const userId = req.user!.id;
      const record = await databaseService.updateRecord(id, recordId, req.body, userId);

      res.json(successResponse(record, 'Record updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/database/tables/:id/records/:recordId
  deleteRecord = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, recordId } = req.params;
      await databaseService.deleteRecord(id, recordId);

      res.json(successResponse(null, 'Record deleted successfully'));
    } catch (error) {
      next(error);
    }
  };

  // POST /api/database/tables/:id/import
  importCSV = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'CSV file is required' },
        });
      }

      const result = await databaseService.importCSV(id, req.file, userId);

      res.json(successResponse(result, 'CSV imported successfully'));
    } catch (error) {
      next(error);
    }
  };

  // GET /api/database/tables/:id/export
  exportCSV = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const csv = await databaseService.exportCSV(id);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="table-${id}.csv"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  };
}

export const databaseController = new DatabaseController();

