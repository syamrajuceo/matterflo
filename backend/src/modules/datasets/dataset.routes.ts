import { Router } from 'express';
import { datasetController } from './dataset.controller';
import { authenticateToken } from '../auth/auth.middleware';
import { requireDeveloper } from '../../common/middleware/authorization.middleware';
import { validate } from '../../common/middleware/validation.middleware';
import {
  createDatasetSchema,
  updateDatasetSchema,
  addSectionSchema,
  updateSectionSchema,
  reorderSectionsSchema,
} from './dataset.validation';

const router = Router();

// All dataset routes require authentication
router.use(authenticateToken);

// Dataset CRUD operations
// CREATE/UPDATE/DELETE - Only developers
router.post('/', requireDeveloper, validate(createDatasetSchema), datasetController.createDataset);
router.put('/:id', requireDeveloper, validate(updateDatasetSchema), datasetController.updateDataset);
router.delete('/:id', requireDeveloper, datasetController.deleteDataset);

// READ - All authenticated users
router.get('/', datasetController.listDatasets);
router.get('/:id', datasetController.getDataset);

// Section operations - Only developers
router.post('/:id/sections', requireDeveloper, validate(addSectionSchema), datasetController.addSection);
router.put('/:id/sections/:sectionId', requireDeveloper, validate(updateSectionSchema), datasetController.updateSection);
router.delete('/:id/sections/:sectionId', requireDeveloper, datasetController.deleteSection);
router.put('/:id/sections/reorder', requireDeveloper, validate(reorderSectionsSchema), datasetController.reorderSections);

// Data operations - All authenticated users
router.get('/:id/data', datasetController.getDatasetWithData);

// Publish operation - Only developers
router.post('/:id/publish', requireDeveloper, datasetController.publishDataset);

export default router;

