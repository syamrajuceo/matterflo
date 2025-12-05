import { Router } from 'express';
import multer from 'multer';
import { databaseController } from './database.controller';
import { authenticateToken } from '../auth/auth.middleware';
import { validate } from '../../common/middleware/validation.middleware';
import {
  createTableSchema,
  updateTableSchema,
  addFieldSchema,
  updateFieldSchema,
  createRelationSchema,
  insertRecordSchema,
  updateRecordSchema,
} from './database.validation';

const router = Router();

// Configure multer for CSV file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

import { requireDeveloper } from '../../common/middleware/authorization.middleware';

// All database routes require authentication
router.use(authenticateToken);

// Table CRUD operations
// SCHEMA OPERATIONS - Only developers
router.post('/', requireDeveloper, validate(createTableSchema), databaseController.createTable);
router.put('/:id', requireDeveloper, validate(updateTableSchema), databaseController.updateTable);

// READ - All authenticated users
router.get('/', databaseController.listTables);
router.get('/:id', databaseController.getTable);

// Field operations - Only developers (schema changes)
router.post('/:id/fields', requireDeveloper, validate(addFieldSchema), databaseController.addField);
router.put('/:id/fields/:fieldId', requireDeveloper, validate(updateFieldSchema), databaseController.updateField);
router.delete('/:id/fields/:fieldId', requireDeveloper, databaseController.deleteField);

// Relation operations - Only developers (schema changes)
router.post('/:id/relations', requireDeveloper, validate(createRelationSchema), databaseController.createRelation);

// Record operations - All authenticated users (data management)
router.post('/:id/records', validate(insertRecordSchema), databaseController.insertRecord);
router.get('/:id/records', databaseController.queryRecords);
router.put('/:id/records/:recordId', validate(updateRecordSchema), databaseController.updateRecord);
router.delete('/:id/records/:recordId', databaseController.deleteRecord);

// Import/Export operations - All authenticated users
router.post('/:id/import', upload.single('file'), databaseController.importCSV);
router.get('/:id/export', databaseController.exportCSV);

export default router;

