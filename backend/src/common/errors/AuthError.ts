import { AppError } from './AppError';

export class AuthError extends AppError {
  constructor(message: string, code: string = 'AUTH_ERROR') {
    super(401, code, message);
    this.name = 'AuthError';
  }
}

