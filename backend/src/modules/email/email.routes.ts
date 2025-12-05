import { Router } from 'express';
import { emailController } from './email.controller';
import { authenticateToken } from '../auth/auth.middleware';
import { requireDeveloper } from '../../common/middleware/authorization.middleware';
import { validate } from '../../common/middleware/validation.middleware';
import {
  createEmailTemplateSchema,
  updateEmailTemplateSchema,
  sendEmailSchema,
  previewTemplateSchema,
} from './email.validation';

const router = Router();

// All email routes require authentication
router.use(authenticateToken);

// Template CRUD - Only developers
router.post('/templates', requireDeveloper, validate(createEmailTemplateSchema), emailController.createTemplate);
router.get('/templates', emailController.listTemplates);
router.get('/templates/:id', emailController.getTemplate);
router.put('/templates/:id', requireDeveloper, validate(updateEmailTemplateSchema), emailController.updateTemplate);
router.delete('/templates/:id', requireDeveloper, emailController.deleteTemplate);

// Template preview - All authenticated users
router.post('/templates/:id/preview', validate(previewTemplateSchema), emailController.previewTemplate);

// Send email - Only developers (for testing)
router.post('/send', requireDeveloper, validate(sendEmailSchema), emailController.sendEmail);

export default router;


