export interface IEmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  type: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface IPreviewTemplateResponse {
  subject: string;
  body: string;
}

