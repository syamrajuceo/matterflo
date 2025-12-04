import { Router } from 'express';
import { datasetController } from './dataset.controller';
import { authenticateToken } from '../auth/auth.middleware';
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
router.post('/', validate(createDatasetSchema), datasetController.createDataset);
router.get('/', datasetController.listDatasets);
router.get('/:id', datasetController.getDataset);
router.put('/:id', validate(updateDatasetSchema), datasetController.updateDataset);
router.delete('/:id', datasetController.deleteDataset);

// Section operations
router.post('/:id/sections', validate(addSectionSchema), datasetController.addSection);
router.put('/:id/sections/:sectionId', validate(updateSectionSchema), datasetController.updateSection);
router.delete('/:id/sections/:sectionId', datasetController.deleteSection);
router.put('/:id/sections/reorder', validate(reorderSectionsSchema), datasetController.reorderSections);

// Data operations
router.get('/:id/data', datasetController.getDatasetWithData);

// Publish operation
router.post('/:id/publish', datasetController.publishDataset);

export default router;

