import axios from 'axios';
import type {
  IEmailTemplate,
  ICreateEmailTemplateRequest,
  IUpdateEmailTemplateRequest,
  IPreviewTemplateResponse,
} from '../types/email.types';

class EmailService {
  /**
   * Create a new email template
   */
  async createTemplate(data: ICreateEmailTemplateRequest): Promise<IEmailTemplate> {
    const response = await axios.post<{ success: boolean; data: IEmailTemplate }>(
      '/email/templates',
      data
    );
    return response.data.data;
  }

  /**
   * List all email templates
   */
  async listTemplates(type?: string, isActive?: boolean): Promise<IEmailTemplate[]> {
    const params: Record<string, string> = {};
    if (type) params.type = type;
    if (isActive !== undefined) params.isActive = String(isActive);

    const response = await axios.get<{ success: boolean; data: IEmailTemplate[] }>(
      '/email/templates',
      { params }
    );
    return response.data.data;
  }

  /**
   * Get a single email template by ID
   */
  async getTemplate(id: string): Promise<IEmailTemplate> {
    const response = await axios.get<{ success: boolean; data: IEmailTemplate }>(
      `/email/templates/${id}`
    );
    return response.data.data;
  }

  /**
   * Update an email template
   */
  async updateTemplate(id: string, data: IUpdateEmailTemplateRequest): Promise<IEmailTemplate> {
    const response = await axios.put<{ success: boolean; data: IEmailTemplate }>(
      `/email/templates/${id}`,
      data
    );
    return response.data.data;
  }

  /**
   * Delete an email template
   */
  async deleteTemplate(id: string): Promise<void> {
    await axios.delete(`/email/templates/${id}`);
  }

  /**
   * Preview a template with sample variables
   */
  async previewTemplate(
    id: string,
    sampleVariables?: Record<string, any>
  ): Promise<IPreviewTemplateResponse> {
    const response = await axios.post<{ success: boolean; data: IPreviewTemplateResponse }>(
      `/email/templates/${id}/preview`,
      { sampleVariables }
    );
    return response.data.data;
  }
}

export const emailService = new EmailService();

