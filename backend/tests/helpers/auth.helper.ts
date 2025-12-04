/**
 * Authentication helper utilities for testing
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { getTestPrismaClient } from './db.helper';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

export interface TestUser {
  id: string;
  email: string;
  role: 'DEVELOPER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  companyId: string;
}

/**
 * Generate a test JWT token
 */
export function generateTestToken(user: Partial<TestUser>): string {
  const payload = {
    id: user.id || 'test-user-id',
    email: user.email || 'test@example.com',
    role: user.role || 'EMPLOYEE',
    companyId: user.companyId || 'test-company-id',
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Create a test user in the database
 */
export async function createTestUser(data: {
  email?: string;
  password?: string;
  role?: 'DEVELOPER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  companyId?: string;
  firstName?: string;
  lastName?: string;
}): Promise<TestUser> {
  const prisma = getTestPrismaClient();

  // Use a transaction to ensure company and user are created atomically
  const result = await prisma.$transaction(async (tx) => {
    // Create company if companyId not provided
    let companyId = data.companyId;
    if (!companyId) {
      // Use a unique domain for each test to avoid conflicts
      const uniqueDomain = `test-company-${Date.now()}-${Math.random().toString(36).substring(7)}.local`;
      
      // Create a new company for this test
      const company = await tx.company.create({
        data: {
          name: 'Test Company',
          domain: uniqueDomain,
          isActive: true,
        },
      });
      
      companyId = company.id;
    } else {
      // Verify company exists if provided
      const companyExists = await tx.company.findUnique({
        where: { id: companyId },
      });
      if (!companyExists) {
        throw new Error(`Company with id ${companyId} does not exist`);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password || 'password123', 10);

    // Create user in the same transaction
    // Use a more unique email with timestamp and random component
    const uniqueEmail = data.email || `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    const user = await tx.user.create({
      data: {
        email: uniqueEmail,
        password: hashedPassword,
        firstName: data.firstName || 'Test',
        lastName: data.lastName || 'User',
        role: (data.role || 'EMPLOYEE') as any,
        companyId: companyId,
        isActive: true,
      },
    });
    
    return {
      id: user.id,
      email: user.email,
      role: user.role as 'DEVELOPER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE',
      companyId: user.companyId!,
    };
  });
  
  return result;
}

/**
 * Generate authorization header for test requests
 */
export function getAuthHeader(user: Partial<TestUser>): string {
  const token = generateTestToken(user);
  return `Bearer ${token}`;
}

/**
 * Create test user and return token
 */
export async function createTestUserWithToken(data?: {
  email?: string;
  password?: string;
  role?: 'DEVELOPER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  companyId?: string;
}): Promise<{ user: TestUser; token: string; authHeader: string }> {
  const user = await createTestUser(data || {});
  const token = generateTestToken(user);
  const authHeader = getAuthHeader(user);

  return { user, token, authHeader };
}

