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

// All database routes require authentication
router.use(authenticateToken);

// Table CRUD operations
router.post('/', validate(createTableSchema), databaseController.createTable);
router.get('/', databaseController.listTables);
router.get('/:id', databaseController.getTable);
router.put('/:id', validate(updateTableSchema), databaseController.updateTable);

// Field operations
router.post('/:id/fields', validate(addFieldSchema), databaseController.addField);
router.put('/:id/fields/:fieldId', validate(updateFieldSchema), databaseController.updateField);
router.delete('/:id/fields/:fieldId', databaseController.deleteField);

// Relation operations
router.post('/:id/relations', validate(createRelationSchema), databaseController.createRelation);

// Record operations
router.post('/:id/records', validate(insertRecordSchema), databaseController.insertRecord);
router.get('/:id/records', databaseController.queryRecords);
router.put('/:id/records/:recordId', validate(updateRecordSchema), databaseController.updateRecord);
router.delete('/:id/records/:recordId', databaseController.deleteRecord);

// Import/Export operations
router.post('/:id/import', upload.single('file'), databaseController.importCSV);
router.get('/:id/export', databaseController.exportCSV);

export default router;

