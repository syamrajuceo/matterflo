/**
 * Task Service Tests
 */

// Mock the prisma import BEFORE importing the service
// We need to get a reference to the test Prisma client that will be shared
const { getTestPrismaClient } = require('../../helpers/db.helper');
const testPrisma = getTestPrismaClient();

jest.mock('../../../src/common/config/database.config', () => ({
  prisma: testPrisma,
  connectDatabase: jest.fn(),
  disconnectDatabase: jest.fn(),
}));

import { taskService } from '../../../src/modules/tasks/task.service';
import { connectTestDatabase, disconnectTestDatabase, cleanDatabase } from '../../helpers/db.helper';
import { createTestUser } from '../../helpers/auth.helper';

describe('TaskService', () => {
  let testUser: { id: string; companyId: string };

  beforeAll(async () => {
    await connectTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
    const user = await createTestUser({
      email: 'taskuser@example.com',
    });
    testUser = { id: user.id, companyId: user.companyId };
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const taskData = {
        name: 'Test Task',
        description: 'Test Description',
        companyId: testUser.companyId,
        createdById: testUser.id,
      };

      const task = await taskService.createTask(taskData);

      expect(task).toHaveProperty('id');
      expect(task.name).toBe(taskData.name);
      expect(task.description).toBe(taskData.description);
      expect(task.companyId).toBe(testUser.companyId);
      expect(task.createdById).toBe(testUser.id);
    });
  });

  describe('getTask', () => {
    it('should get a task by id', async () => {
      const task = await taskService.createTask({
        name: 'Test Task',
        companyId: testUser.companyId,
        createdById: testUser.id,
      });

      const found = await taskService.getTask(task.id);

      expect(found).toHaveProperty('id', task.id);
      expect(found?.name).toBe('Test Task');
    });

    it('should return null for non-existent task', async () => {
      const found = await taskService.getTask('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('listTasks', () => {
    it('should list tasks for a company', async () => {
      const task1 = await taskService.createTask({
        name: 'Task 1',
        companyId: testUser.companyId,
        createdById: testUser.id,
      });
      const task2 = await taskService.createTask({
        name: 'Task 2',
        companyId: testUser.companyId,
        createdById: testUser.id,
      });

      const result = await taskService.listTasks({ companyId: testUser.companyId });

      expect(result.tasks.length).toBe(2);
      expect(result.tasks.some(t => t.id === task1.id)).toBe(true);
      expect(result.tasks.some(t => t.id === task2.id)).toBe(true);
    });
  });
});

