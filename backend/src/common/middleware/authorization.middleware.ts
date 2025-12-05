import { Request, Response, NextFunction } from 'express';
import { AuthError } from '../errors';
import { IUser } from '../../modules/auth/auth.types';

/**
 * Require user to be a DEVELOPER
 * Only developers can create/modify structural elements (tasks, flows, datasets, DB schemas)
 */
export function requireDeveloper(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new AuthError('Not authenticated'));
  }
  
  if (req.user.role !== 'DEVELOPER') {
    return next(new AuthError(
      'This action requires developer privileges. Only developers can create or modify tasks, flows, datasets, and database schemas.',
      'INSUFFICIENT_PERMISSIONS'
    ));
  }
  
  next();
}

/**
 * Require user to be DEVELOPER or ADMIN
 * Admins can manage company structure but not create tasks/flows
 */
export function requireDeveloperOrAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new AuthError('Not authenticated'));
  }
  
  if (!['DEVELOPER', 'ADMIN'].includes(req.user.role)) {
    return next(new AuthError('Insufficient permissions'));
  }
  
  next();
}

/**
 * Allow clients (ADMIN, MANAGER, EMPLOYEE) to perform limited actions
 * Used for employee/role management and limited flow edits
 */
export function allowClientAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new AuthError('Not authenticated'));
  }
  
  // All authenticated users can access client features
  next();
}

/**
 * Check if user can edit flow (clients can add levels, change assignments)
 * But cannot create flows, reorder levels, or delete core levels
 */
export function canEditFlow(allowLimitedEdit: boolean = false) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthError('Not authenticated'));
    }
    
    // Developers can do everything
    if (req.user.role === 'DEVELOPER') {
      return next();
    }
    
    // Clients can only do limited edits if flag is set
    if (allowLimitedEdit && ['ADMIN', 'MANAGER'].includes(req.user.role)) {
      return next();
    }
    
    return next(new AuthError(
      'Only developers can perform this action. Clients can only add levels and change assignments.',
      'INSUFFICIENT_PERMISSIONS'
    ));
  };
}

/**
 * Check if user can manage employees and roles
 * ADMIN and MANAGER can do this, DEVELOPER can always do it
 */
export function canManageEmployees(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new AuthError('Not authenticated'));
  }
  
  if (['DEVELOPER', 'ADMIN', 'MANAGER'].includes(req.user.role)) {
    return next();
  }
  
  return next(new AuthError(
    'Only administrators and managers can manage employees and roles.',
    'INSUFFICIENT_PERMISSIONS'
  ));
}

