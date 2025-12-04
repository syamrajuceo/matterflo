/**
 * Database helper utilities for testing
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

let prisma: PrismaClient | null = null;

/**
 * Get or create Prisma client for testing
 */
export function getTestPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }
  return prisma;
}

/**
 * Connect to test database
 */
export async function connectTestDatabase(): Promise<void> {
  const client = getTestPrismaClient();
  await client.$connect();
}

/**
 * Disconnect from test database
 */
export async function disconnectTestDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

/**
 * Clean database (delete all data)
 * Deletes in reverse order of dependencies to avoid foreign key constraint violations
 */
export async function cleanDatabase(): Promise<void> {
  const client = getTestPrismaClient();
  
  try {
    // Delete in reverse order of dependencies (child tables first)
    // 1. Execution and runtime data
    await client.triggerExecution.deleteMany();
    await client.taskExecution.deleteMany();
    await client.flowInstance.deleteMany();
    // Note: ClientTaskCompletion table may not exist in all schemas
    try {
      await client.clientTaskCompletion.deleteMany();
    } catch (error) {
      // Table doesn't exist, skip
    }
    
    // 2. Triggers and workflows
    await client.trigger.deleteMany();
    await client.flowBranch.deleteMany();
    await client.flowLevelTask.deleteMany();
    await client.flowLevel.deleteMany();
    await client.flow.deleteMany();
    
    // 3. Tasks
    await client.task.deleteMany();
    
    // 4. Integration workflows and integrations
    await client.integrationWorkflow.deleteMany();
    await client.integration.deleteMany();
    
    // 5. Datasets
    await client.dataset.deleteMany();
    
    // 6. Custom tables and records
    await client.customTableRecord.deleteMany();
    await client.customTable.deleteMany();
    
    // 7. Company hierarchy (roles depend on departments, departments depend on company)
    await client.role.deleteMany();
    await client.department.deleteMany();
    
    // 8. Audit logs (must be deleted before users due to foreign key)
    await client.auditLog.deleteMany();
    
    // 9. Users (must be deleted before company due to foreign key)
    await client.user.deleteMany();
    
    // 10. Company (root of hierarchy)
    await client.company.deleteMany();
    
    // 11. Other models (if any)
    await client.version.deleteMany();
    await client.file.deleteMany();
    await client.emailTemplate.deleteMany();
  } catch (error) {
    console.error('Error cleaning database:', error);
    throw error;
  }
}

/**
 * Reset database (drop and recreate)
 */
export async function resetDatabase(): Promise<void> {
  try {
    // Run Prisma migrate reset in test mode
    execSync('npx prisma migrate reset --force --skip-seed', {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'test' },
    });
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
}

/**
 * Transaction wrapper for tests
 */
export async function withTransaction<T>(
  callback: (tx: any) => Promise<T>
): Promise<T> {
  const client = getTestPrismaClient();
  return await client.$transaction(callback);
}

