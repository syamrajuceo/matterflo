import { AppError } from './AppError';

export class ValidationError extends AppError {
  constructor(message: string, details: any) {
    super(400, 'VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

