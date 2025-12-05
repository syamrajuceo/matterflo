import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.config';
import { AuthError } from '../errors';

/**
 * Middleware to set active company context from query param or header
 * Developers can switch between companies they have access to
 */
export async function setCompanyContext(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AuthError('Not authenticated'));
    }

    // Get company ID from query param, header, or user's default company
    const companyId = 
      req.query.companyId as string || 
      req.headers['x-company-id'] as string || 
      req.user.companyId;

    if (!companyId) {
      return next(new AuthError('Company context required'));
    }

    // Verify user has access to this company
    if (req.user.role === 'DEVELOPER') {
      // Developers can access any company
      const company = await prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        return next(new AuthError('Company not found'));
      }

      req.companyContext = company;
    } else {
      // Non-developers can only access their own company
      if (req.user.companyId !== companyId) {
        return next(new AuthError('Access denied to this company'));
      }

      const company = await prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        return next(new AuthError('Company not found'));
      }

      req.companyContext = company;
    }

    next();
  } catch (error) {
    next(error);
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      companyContext?: {
        id: string;
        name: string;
        domain: string | null;
        logo: string | null;
        primaryColor: string;
        secondaryColor: string;
        isActive: boolean;
      };
    }
  }
}

