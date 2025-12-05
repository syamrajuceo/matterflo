export interface IEmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  type: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateEmailTemplateRequest {
  name: string;
  subject: string;
  body: string;
  variables?: string[];
  type?: string;
  isActive?: boolean;
}

export interface IUpdateEmailTemplateRequest {
  name?: string;
  subject?: string;
  body?: string;
  variables?: string[];
  type?: string;
  isActive?: boolean;
}

export interface ISendEmailRequest {
  to: string | string[];
  subject?: string;
  body?: string;
  templateId?: string;
  variables?: Record<string, any>;
  from?: string;
}


