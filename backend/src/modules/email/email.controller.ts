import { Request, Response, NextFunction } from 'express';
import { emailService } from './email.service';
import { successResponse } from '../../common/utils/response';

class EmailController {
  // POST /api/email/templates
  createTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const template = await emailService.createTemplate(req.body);
      res.status(201).json(successResponse(template));
    } catch (error) {
      next(error);
    }
  };

  // GET /api/email/templates
  listTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, isActive } = req.query;
      const templates = await emailService.listTemplates(
        type as string | undefined,
        isActive === 'true' ? true : isActive === 'false' ? false : undefined
      );
      res.json(successResponse(templates));
    } catch (error) {
      next(error);
    }
  };

  // GET /api/email/templates/:id
  getTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const template = await emailService.getTemplate(id);
      res.json(successResponse(template));
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/email/templates/:id
  updateTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const template = await emailService.updateTemplate(id, req.body);
      res.json(successResponse(template));
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/email/templates/:id
  deleteTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await emailService.deleteTemplate(id);
      res.json(successResponse({ message: 'Template deleted successfully' }));
    } catch (error) {
      next(error);
    }
  };

  // POST /api/email/templates/:id/preview
  previewTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { sampleVariables } = req.body;
      const preview = await emailService.previewTemplate(id, sampleVariables);
      res.json(successResponse(preview));
    } catch (error) {
      next(error);
    }
  };

  // POST /api/email/send
  sendEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await emailService.sendEmail(req.body);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };
}

export const emailController = new EmailController();


