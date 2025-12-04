/**
 * Seed helper utilities for testing
 */

import { getTestPrismaClient } from './db.helper';
import { createTestUser } from './auth.helper';

/**
 * Seed test data
 */
export async function seedTestData() {
  const prisma = getTestPrismaClient();

  // Create test company
  const company = await prisma.company.create({
    data: {
      name: 'Test Company',
      domain: 'test-company.local',
      isActive: true,
    },
  });

  // Create test users
  const adminUser = await createTestUser({
    email: 'admin@test-company.local',
    password: 'password123',
    role: 'ADMIN',
    companyId: company.id,
    firstName: 'Admin',
    lastName: 'User',
  });

  const regularUser = await createTestUser({
    email: 'user@test-company.local',
    password: 'password123',
    role: 'USER',
    companyId: company.id,
    firstName: 'Regular',
    lastName: 'User',
  });

  return {
    company,
    adminUser,
    regularUser,
  };
}

/**
 * Seed minimal test data (company + admin user)
 */
export async function seedMinimalTestData() {
  const prisma = getTestPrismaClient();

  const company = await prisma.company.create({
    data: {
      name: 'Test Company',
      domain: 'test-company.local',
      isActive: true,
    },
  });

  const adminUser = await createTestUser({
    email: 'admin@test-company.local',
    password: 'password123',
    role: 'ADMIN',
    companyId: company.id,
  });

  return { company, adminUser };
}

