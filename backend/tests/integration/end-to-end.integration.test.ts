/**
 * End-to-End Integration Tests
 * Tests the full workflow: Create task → Create flow → Add trigger → Execute flow → Trigger fires
 */

// Mock the prisma import BEFORE importing the service
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
import { createTestUser } from '../helpers/auth.helper';

// Import app after mocks are set up
let app: Express;
let authToken: string;
let testUser: { id: string; companyId: string; email: string };

describe('End-to-End Integration Tests', () => {
  beforeAll(async () => {
    await connectTestDatabase();
    const appModule = require('../../src/app');
    app = appModule.default;

    // Create test user and get auth token
    testUser = await createTestUser({
      email: 'e2e@example.com',
      password: 'password123',
    });

    // Verify user exists before attempting login
    const { getTestPrismaClient } = require('../helpers/db.helper');
    const testPrisma = getTestPrismaClient();
    const verifyUser = await testPrisma.user.findUnique({
      where: { email: 'e2e@example.com' },
    });
    
    if (!verifyUser) {
      throw new Error('User was not created in database');
    }

    await new Promise(resolve => setTimeout(resolve, 150));

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'e2e@example.com',
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
    
    // Recreate test user after cleanup with unique email to avoid conflicts
    const uniqueEmail = `e2e-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
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

  describe('Full Workflow', () => {
    it('should complete full workflow: Create task → Create flow → Add task to flow → Add trigger → Publish flow', async () => {
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
      const taskId = taskResponse.body.data.id;
      expect(taskResponse.body.data.name).toBe('Review Document');

      // Step 2: Create a flow
      const flowResponse = await request(app)
        .post('/api/flows')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Document Review Workflow',
          description: 'Complete workflow for document review',
        })
        .expect(201);

      expect(flowResponse.body).toHaveProperty('success', true);
      const flowId = flowResponse.body.data.id;
      expect(flowResponse.body.data.name).toBe('Document Review Workflow');
      expect(flowResponse.body.data.status).toBe('DRAFT');

      // Step 3: Add a level to the flow
      const levelResponse = await request(app)
        .post(`/api/flows/${flowId}/levels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Review Level',
          description: 'Level for document review',
        })
        .expect(200);

      expect(levelResponse.body.data.levels).toHaveLength(1);
      const levelId = levelResponse.body.data.levels[0].id;

      // Step 4: Add the task to the level
      const addTaskResponse = await request(app)
        .post(`/api/flows/${flowId}/levels/${levelId}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          taskId: taskId,
        })
        .expect(200);

      expect(addTaskResponse.body.data.levels[0].tasks).toHaveLength(1);
      expect(addTaskResponse.body.data.levels[0].tasks[0].taskId).toBe(taskId);

      // Step 5: Create a trigger for the task
      const triggerResponse = await request(app)
        .post('/api/triggers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Document Review Trigger',
          description: 'Trigger when document review is completed',
          eventType: 'TASK_COMPLETED',
          eventConfig: {},
          conditions: {
            operator: 'AND',
            conditions: [
              {
                field: 'status',
                operator: 'equals',
                value: 'COMPLETED',
              },
            ],
          },
          actions: [
            {
              type: 'email',
              to: 'admin@example.com',
              subject: 'Document Review Completed',
              body: 'The document review task has been completed.',
            },
          ],
          taskId: taskId,
        })
        .expect(201);

      expect(triggerResponse.body).toHaveProperty('success', true);
      const triggerId = triggerResponse.body.data.id;
      expect(triggerResponse.body.data.name).toBe('Document Review Trigger');
      expect(triggerResponse.body.data.taskId).toBe(taskId);

      // Step 6: Publish the flow
      const publishResponse = await request(app)
        .post(`/api/flows/${flowId}/publish`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(publishResponse.body).toHaveProperty('success', true);
      expect(publishResponse.body.data.status).toBe('PUBLISHED');
      expect(publishResponse.body.data.publishedAt).toBeDefined();

      // Step 7: Verify the complete setup
      const getFlowResponse = await request(app)
        .get(`/api/flows/${flowId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getFlowResponse.body.data.status).toBe('PUBLISHED');
      expect(getFlowResponse.body.data.levels).toHaveLength(1);
      expect(getFlowResponse.body.data.levels[0].tasks).toHaveLength(1);

      // Step 8: Verify trigger exists
      const getTriggerResponse = await request(app)
        .get(`/api/triggers/${triggerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getTriggerResponse.body.data.taskId).toBe(taskId);
      expect(getTriggerResponse.body.data.isActive).toBe(true);

      // Step 9: Test the trigger with sample data
      const testTriggerResponse = await request(app)
        .post(`/api/triggers/${triggerId}/test`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sampleData: {
            status: 'COMPLETED',
            taskId: taskId,
          },
        })
        .expect(200);

      expect(testTriggerResponse.body).toHaveProperty('success', true);
      expect(testTriggerResponse.body.data).toHaveProperty('conditionsMet');
      expect(testTriggerResponse.body.data).toHaveProperty('evaluationTime');
    });

    it('should create a complex workflow with multiple tasks, levels, and triggers', async () => {
      // Create multiple tasks
      const task1Response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Task 1: Initial Review' })
        .expect(201);

      const task2Response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Task 2: Final Approval' })
        .expect(201);

      const task1Id = task1Response.body.data.id;
      const task2Id = task2Response.body.data.id;

      // Create flow
      const flowResponse = await request(app)
        .post('/api/flows')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Multi-Stage Review Process',
          description: 'Complex workflow with multiple stages',
        })
        .expect(201);

      const flowId = flowResponse.body.data.id;

      // Add multiple levels
      const level1Response = await request(app)
        .post(`/api/flows/${flowId}/levels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Initial Review Stage' })
        .expect(200);

      const level2Response = await request(app)
        .post(`/api/flows/${flowId}/levels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Final Approval Stage' })
        .expect(200);

      const level1Id = level1Response.body.data.levels[0].id;
      const level2Id = level2Response.body.data.levels[1].id;

      // Add tasks to levels
      await request(app)
        .post(`/api/flows/${flowId}/levels/${level1Id}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ taskId: task1Id })
        .expect(200);

      await request(app)
        .post(`/api/flows/${flowId}/levels/${level2Id}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ taskId: task2Id })
        .expect(200);

      // Create triggers for each task
      const trigger1Response = await request(app)
        .post('/api/triggers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Initial Review Trigger',
          eventType: 'TASK_COMPLETED',
          eventConfig: {},
          actions: [
            {
              type: 'email',
              to: 'admin@example.com',
              subject: 'Initial Review Completed',
              body: 'Initial review has been completed',
            },
          ],
          taskId: task1Id,
        })
        .expect(201);

      const trigger2Response = await request(app)
        .post('/api/triggers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Final Approval Trigger',
          eventType: 'TASK_COMPLETED',
          eventConfig: {},
          actions: [
            {
              type: 'email',
              to: 'admin@example.com',
              subject: 'Final Approval Completed',
              body: 'Final approval has been completed',
            },
          ],
          taskId: task2Id,
        })
        .expect(201);

      // Publish flow
      await request(app)
        .post(`/api/flows/${flowId}/publish`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify complete setup
      const getFlowResponse = await request(app)
        .get(`/api/flows/${flowId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getFlowResponse.body.data.levels).toHaveLength(2);
      expect(getFlowResponse.body.data.levels[0].tasks).toHaveLength(1);
      expect(getFlowResponse.body.data.levels[1].tasks).toHaveLength(1);
      expect(getFlowResponse.body.data.status).toBe('PUBLISHED');

      // Verify triggers
      const triggersResponse = await request(app)
        .get(`/api/triggers?taskId=${task1Id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(triggersResponse.body.data).toHaveProperty('triggers');
      expect(Array.isArray(triggersResponse.body.data.triggers)).toBe(true);
      expect(triggersResponse.body.data.triggers.length).toBeGreaterThanOrEqual(1);
    });
  });
});

