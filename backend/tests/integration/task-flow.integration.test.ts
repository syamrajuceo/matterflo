/**
 * Task-Flow Integration Tests
 * Tests the integration between Task Builder and Flow Builder
 */

// Mock the prisma import BEFORE importing the service
// We need to get a reference to the test Prisma client that will be shared
const { getTestPrismaClient } = require('../helpers/db.helper');
const testPrisma = getTestPrismaClient();

jest.mock('../../src/common/config/database.config', () => ({
  prisma: testPrisma,
  connectDatabase: jest.fn(),
  disconnectDatabase: jest.fn(),
}));

import request from 'supertest';
import { Express } from 'express';
import { connectTestDatabase, disconnectTestDatabase, cleanDatabase } from '../helpers/db.helper';
import { createTestUser, getAuthHeader } from '../helpers/auth.helper';

// Import app after mocks are set up
let app: Express;
let authToken: string;
let testUser: { id: string; companyId: string; email: string };

describe('Task-Flow Integration Tests', () => {
  beforeAll(async () => {
    await connectTestDatabase();
    // Import app after mocks are set up using require to avoid TypeScript module resolution issues
    const appModule = require('../../src/app');
    app = appModule.default;

    // Create test user and get auth token
    testUser = await createTestUser({
      email: 'taskflow@example.com',
      password: 'password123',
    });

    // Verify user exists before attempting login
    const { getTestPrismaClient } = require('../helpers/db.helper');
    const testPrisma = getTestPrismaClient();
    const verifyUser = await testPrisma.user.findUnique({
      where: { email: 'taskflow@example.com' },
    });
    
    if (!verifyUser) {
      throw new Error('User was not created in database');
    }

    await new Promise(resolve => setTimeout(resolve, 150));

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'taskflow@example.com',
        password: 'password123',
      })
      .expect(200);

    expect(loginResponse.body).toHaveProperty('success', true);
    expect(loginResponse.body.data).toHaveProperty('token');
    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
    
    // Recreate test user after cleanup with unique email
    const uniqueEmail = `taskflow-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    testUser = await createTestUser({
      email: uniqueEmail,
      password: 'password123',
    });

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: uniqueEmail,
        password: 'password123',
      })
      .expect(200);

    expect(loginResponse.body).toHaveProperty('success', true);
    expect(loginResponse.body.data).toHaveProperty('token');
    authToken = loginResponse.body.data.token;
  });

  describe('Create Task → Create Flow → Add Task to Flow', () => {
    it('should create a task, create a flow, add level, add task to level, and publish flow', async () => {
      // Step 1: Create a task
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Review Document',
          description: 'Review and approve document',
        })
        .expect(201);

      expect(taskResponse.body).toHaveProperty('success', true);
      expect(taskResponse.body.data).toHaveProperty('id');
      expect(taskResponse.body.data.name).toBe('Review Document');
      const taskId = taskResponse.body.data.id;

      // Step 2: Create a flow
      const flowResponse = await request(app)
        .post('/api/flows')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Document Review Flow',
          description: 'Flow for reviewing documents',
        })
        .expect(201);

      expect(flowResponse.body).toHaveProperty('success', true);
      expect(flowResponse.body.data).toHaveProperty('id');
      expect(flowResponse.body.data.name).toBe('Document Review Flow');
      expect(flowResponse.body.data.status).toBe('DRAFT');
      const flowId = flowResponse.body.data.id;

      // Step 3: Add a level to the flow
      const levelResponse = await request(app)
        .post(`/api/flows/${flowId}/levels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Review Level',
          description: 'Level for document review',
        })
        .expect(200);

      expect(levelResponse.body).toHaveProperty('success', true);
      expect(levelResponse.body.data.levels).toHaveLength(1);
      expect(levelResponse.body.data.levels[0].name).toBe('Review Level');
      const levelId = levelResponse.body.data.levels[0].id;

      // Step 4: Add the task to the level
      const addTaskResponse = await request(app)
        .post(`/api/flows/${flowId}/levels/${levelId}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          taskId: taskId,
        })
        .expect(200);

      expect(addTaskResponse.body).toHaveProperty('success', true);
      expect(addTaskResponse.body.data.levels[0].tasks).toHaveLength(1);
      expect(addTaskResponse.body.data.levels[0].tasks[0].taskId).toBe(taskId);

      // Step 5: Publish the flow
      const publishResponse = await request(app)
        .post(`/api/flows/${flowId}/publish`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(publishResponse.body).toHaveProperty('success', true);
      expect(publishResponse.body.data.status).toBe('PUBLISHED');
      expect(publishResponse.body.data.publishedAt).toBeDefined();
    });

    it('should create a flow with multiple levels and tasks', async () => {
      // Create two tasks
      const task1Response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Task 1',
          description: 'First task',
        })
        .expect(201);

      const task2Response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Task 2',
          description: 'Second task',
        })
        .expect(201);

      const task1Id = task1Response.body.data.id;
      const task2Id = task2Response.body.data.id;

      // Create a flow
      const flowResponse = await request(app)
        .post('/api/flows')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Multi-Level Flow',
          description: 'Flow with multiple levels',
        })
        .expect(201);

      const flowId = flowResponse.body.data.id;

      // Add first level
      const level1Response = await request(app)
        .post(`/api/flows/${flowId}/levels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Level 1',
          description: 'First level',
        })
        .expect(200);

      const level1Id = level1Response.body.data.levels[0].id;

      // Add second level
      const level2Response = await request(app)
        .post(`/api/flows/${flowId}/levels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Level 2',
          description: 'Second level',
        })
        .expect(200);

      const level2Id = level2Response.body.data.levels[1].id;

      // Add task 1 to level 1
      await request(app)
        .post(`/api/flows/${flowId}/levels/${level1Id}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          taskId: task1Id,
        })
        .expect(200);

      // Add task 2 to level 2
      await request(app)
        .post(`/api/flows/${flowId}/levels/${level2Id}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          taskId: task2Id,
        })
        .expect(200);

      // Verify the flow structure
      const getFlowResponse = await request(app)
        .get(`/api/flows/${flowId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getFlowResponse.body.data.levels).toHaveLength(2);
      expect(getFlowResponse.body.data.levels[0].name).toBe('Level 1');
      expect(getFlowResponse.body.data.levels[0].tasks).toHaveLength(1);
      expect(getFlowResponse.body.data.levels[0].tasks[0].taskId).toBe(task1Id);
      expect(getFlowResponse.body.data.levels[1].name).toBe('Level 2');
      expect(getFlowResponse.body.data.levels[1].tasks).toHaveLength(1);
      expect(getFlowResponse.body.data.levels[1].tasks[0].taskId).toBe(task2Id);
    });

    it('should not allow adding tasks to a published flow', async () => {
      // Create task and flow
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Task',
        })
        .expect(201);

      const taskId = taskResponse.body.data.id;

      const flowResponse = await request(app)
        .post('/api/flows')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Flow',
        })
        .expect(201);

      const flowId = flowResponse.body.data.id;

      // Add level
      const levelResponse = await request(app)
        .post(`/api/flows/${flowId}/levels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Level',
        })
        .expect(200);

      const levelId = levelResponse.body.data.levels[0].id;

      // Publish flow
      await request(app)
        .post(`/api/flows/${flowId}/publish`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Try to add task to published flow - should fail
      const addTaskResponse = await request(app)
        .post(`/api/flows/${flowId}/levels/${levelId}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          taskId: taskId,
        })
        .expect(400);

      expect(addTaskResponse.body).toHaveProperty('success', false);
      expect(addTaskResponse.body.error.message).toContain('published flow');
    });
  });

  describe('Flow Level Reordering', () => {
    it('should reorder levels in a flow', async () => {
      // Create flow
      const flowResponse = await request(app)
        .post('/api/flows')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Reorder Test Flow',
        })
        .expect(201);

      const flowId = flowResponse.body.data.id;

      // Add three levels
      await request(app)
        .post(`/api/flows/${flowId}/levels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Level A' })
        .expect(200);

      await request(app)
        .post(`/api/flows/${flowId}/levels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Level B' })
        .expect(200);

      await request(app)
        .post(`/api/flows/${flowId}/levels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Level C' })
        .expect(200);

      // Get flow to get level IDs
      const getFlowResponse = await request(app)
        .get(`/api/flows/${flowId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const levels = getFlowResponse.body.data.levels;
      expect(levels).toHaveLength(3);
      expect(levels[0].name).toBe('Level A');
      expect(levels[1].name).toBe('Level B');
      expect(levels[2].name).toBe('Level C');

      // Reorder: C, A, B
      const levelIds = [levels[2].id, levels[0].id, levels[1].id];

      const reorderResponse = await request(app)
        .put(`/api/flows/${flowId}/levels/reorder`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          levelIds: levelIds,
        })
        .expect(200);

      expect(reorderResponse.body).toHaveProperty('success', true);
      const reorderedLevels = reorderResponse.body.data.levels;
      expect(reorderedLevels[0].name).toBe('Level C');
      expect(reorderedLevels[1].name).toBe('Level A');
      expect(reorderedLevels[2].name).toBe('Level B');
    });
  });
});

