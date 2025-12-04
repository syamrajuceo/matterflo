import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { AuthError } from '../../common/errors';
import { IUser } from './auth.types';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new AuthError('No token provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await authService.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    next(new AuthError('Invalid token'));
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthError('Not authenticated'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AuthError('Insufficient permissions'));
    }
    next();
  };
}

