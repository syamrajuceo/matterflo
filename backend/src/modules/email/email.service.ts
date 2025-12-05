import { prisma } from '../../common/config/database.config';
import { NotFoundError, ValidationError } from '../../common/errors';
import {
  IEmailTemplate,
  ICreateEmailTemplateRequest,
  IUpdateEmailTemplateRequest,
  ISendEmailRequest,
} from './email.types';
import nodemailer from 'nodemailer';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    // Initialize email transporter if SMTP config exists
    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    ) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  // Map Prisma EmailTemplate to IEmailTemplate
  private mapTemplate(template: any): IEmailTemplate {
    return {
      id: template.id,
      name: template.name,
      subject: template.subject,
      body: template.body,
      variables: Array.isArray(template.variables) ? template.variables : [],
      type: template.type,
      isActive: template.isActive,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  /**
   * Create email template
   */
  async createTemplate(data: ICreateEmailTemplateRequest): Promise<IEmailTemplate> {
    try {
      // Extract variables from body using {{variable}} pattern
      const variablePattern = /\{\{(\w+)\}\}/g;
      const foundVariables: string[] = [];
      let match;
      
      while ((match = variablePattern.exec(data.body)) !== null) {
        if (!foundVariables.includes(match[1])) {
          foundVariables.push(match[1]);
        }
      }
      
      // Also check subject
      while ((match = variablePattern.exec(data.subject)) !== null) {
        if (!foundVariables.includes(match[1])) {
          foundVariables.push(match[1]);
        }
      }

      const template = await prisma.emailTemplate.create({
        data: {
          name: data.name,
          subject: data.subject,
          body: data.body,
          variables: data.variables || foundVariables,
          type: data.type || 'notification',
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
      });

      return this.mapTemplate(template);
    } catch (error) {
      console.error('Error creating email template:', error);
      throw error;
    }
  }

  /**
   * Get all templates
   */
  async listTemplates(type?: string, isActive?: boolean): Promise<IEmailTemplate[]> {
    try {
      const where: any = {};
      if (type) where.type = type;
      if (isActive !== undefined) where.isActive = isActive;

      const templates = await prisma.emailTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return templates.map(t => this.mapTemplate(t));
    } catch (error) {
      console.error('Error listing email templates:', error);
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async getTemplate(id: string): Promise<IEmailTemplate> {
    try {
      const template = await prisma.emailTemplate.findUnique({
        where: { id },
      });

      if (!template) {
        throw new NotFoundError('Email template');
      }

      return this.mapTemplate(template);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error getting email template:', error);
      throw error;
    }
  }

  /**
   * Update template
   */
  async updateTemplate(id: string, data: IUpdateEmailTemplateRequest): Promise<IEmailTemplate> {
    try {
      const existing = await prisma.emailTemplate.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundError('Email template');
      }

      // Extract variables if body/subject changed
      let variables = existing.variables as string[];
      if (data.body || data.subject) {
        const body = data.body || existing.body;
        const subject = data.subject || existing.subject;
        const variablePattern = /\{\{(\w+)\}\}/g;
        const foundVariables: string[] = [];
        let match;
        
        while ((match = variablePattern.exec(body)) !== null) {
          if (!foundVariables.includes(match[1])) {
            foundVariables.push(match[1]);
          }
        }
        
        while ((match = variablePattern.exec(subject)) !== null) {
          if (!foundVariables.includes(match[1])) {
            foundVariables.push(match[1]);
          }
        }
        
        variables = foundVariables;
      }

      const template = await prisma.emailTemplate.update({
        where: { id },
        data: {
          ...data,
          variables: data.variables !== undefined ? data.variables : variables,
        },
      });

      return this.mapTemplate(template);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error updating email template:', error);
      throw error;
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string): Promise<void> {
    try {
      const template = await prisma.emailTemplate.findUnique({
        where: { id },
      });

      if (!template) {
        throw new NotFoundError('Email template');
      }

      await prisma.emailTemplate.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error deleting email template:', error);
      throw error;
    }
  }

  /**
   * Send email using template or direct content
   */
  async sendEmail(request: ISendEmailRequest): Promise<{ success: boolean; messageId?: string }> {
    try {
      let subject = request.subject || '';
      let body = request.body || '';
      let variables: Record<string, any> = request.variables || {};

      // If templateId provided, load template
      if (request.templateId) {
        const template = await this.getTemplate(request.templateId);
        if (!template.isActive) {
          throw new ValidationError('Email template is not active', { templateId: request.templateId });
        }
        
        subject = template.subject;
        body = template.body;
        
        // Merge template variables with request variables
        variables = { ...variables };
      }

      // Replace variables in subject and body
      Object.keys(variables).forEach((key) => {
        const value = String(variables[key]);
        subject = subject.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
        body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      });

      const recipients = Array.isArray(request.to) ? request.to : [request.to];

      // If transporter is configured, send real email
      if (this.transporter) {
        const info = await this.transporter.sendMail({
          from: request.from || process.env.SMTP_FROM || process.env.SMTP_USER,
          to: recipients.join(', '),
          subject,
          html: body,
          text: body.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        });

        return {
          success: true,
          messageId: info.messageId,
        };
      } else {
        // Log email (development mode)
        console.log('📧 Email would be sent:', {
          to: recipients,
          subject,
          body: body.substring(0, 100) + '...',
        });

        return {
          success: true,
        };
      }
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Preview template with sample data
   */
  async previewTemplate(id: string, sampleVariables?: Record<string, any>): Promise<{
    subject: string;
    body: string;
  }> {
    try {
      const template = await this.getTemplate(id);
      
      let subject = template.subject;
      let body = template.body;

      // Replace variables with sample data
      if (sampleVariables) {
        Object.keys(sampleVariables).forEach((key) => {
          const value = String(sampleVariables[key]);
          subject = subject.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
          body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
        });
      } else {
        // Use default sample values
        template.variables.forEach((varName) => {
          const sampleValue = `[${varName}]`;
          subject = subject.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), sampleValue);
          body = body.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), sampleValue);
        });
      }

      return { subject, body };
    } catch (error) {
      console.error('Error previewing template:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();

