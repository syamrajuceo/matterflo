import { AppError } from './AppError';

export class NotFoundError extends AppError {
  constructor(entity: string) {
    super(404, 'NOT_FOUND', `${entity} not found`);
    this.name = 'NotFoundError';
  }
}

