import { Request } from 'express';
import { IUser } from '../../modules/auth/auth.types';
import { prisma } from '../config/database.config';

/**
 * Helper function to get company ID for a user
 * DEVELOPER users can use x-company-id header or first available company
 * Other users use their own companyId
 */
export async function getCompanyIdForUser(user: IUser, req: Request): Promise<string | null> {
  if (user.role === 'DEVELOPER') {
    // DEVELOPER users can access any company via x-company-id header
    const headerCompanyId = req.headers['x-company-id'] as string;
    if (headerCompanyId) {
      return headerCompanyId;
    }
    
    // If no header, get the first available company
    const firstCompany = await prisma.company.findFirst({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return firstCompany?.id || null;
  } else {
    // Non-developers use their own company
    return user.companyId || null;
  }
}

