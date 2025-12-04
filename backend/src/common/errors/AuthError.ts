import { AppError } from './AppError';

export class AuthError extends AppError {
  constructor(message: string) {
    super(401, 'AUTH_ERROR', message);
    this.name = 'AuthError';
  }
}

