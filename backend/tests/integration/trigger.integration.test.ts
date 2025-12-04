/**
 * Trigger Integration Tests
 * Tests trigger creation, evaluation, and execution
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

describe('Trigger Integration Tests', () => {
  beforeAll(async () => {
    await connectTestDatabase();
    const appModule = require('../../src/app');
    app = appModule.default;

    // Create test user and get auth token
    testUser = await createTestUser({
      email: 'trigger@example.com',
      password: 'password123',
    });

    // Verify user exists before attempting login
    const { getTestPrismaClient } = require('../helpers/db.helper');
    const testPrisma = getTestPrismaClient();
    const verifyUser = await testPrisma.user.findUnique({
      where: { email: 'trigger@example.com' },
    });
    
    if (!verifyUser) {
      throw new Error('User was not created in database');
    }

    await new Promise(resolve => setTimeout(resolve, 150));

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'trigger@example.com',
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
    const uniqueEmail = `trigger-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
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

  describe('Create Trigger', () => {
    it('should create a trigger for a task', async () => {
      // Create a task first
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Task',
          description: 'Task for trigger testing',
        })
        .expect(201);

      const taskId = taskResponse.body.data.id;

      // Create a trigger
      const triggerResponse = await request(app)
        .post('/api/triggers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Task Completed Trigger',
          description: 'Trigger when task is completed',
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
              subject: 'Task Completed',
              body: 'A task has been completed.',
            },
          ],
          taskId: taskId,
        })
        .expect(201);

      expect(triggerResponse.body).toHaveProperty('success', true);
      expect(triggerResponse.body.data).toHaveProperty('id');
      expect(triggerResponse.body.data.name).toBe('Task Completed Trigger');
      expect(triggerResponse.body.data.eventType).toBe('TASK_COMPLETED');
      expect(triggerResponse.body.data.taskId).toBe(taskId);
      expect(triggerResponse.body.data.isActive).toBe(true);
    });

    it('should create a trigger for a flow', async () => {
      // Create a flow first
      const flowResponse = await request(app)
        .post('/api/flows')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Flow',
          description: 'Flow for trigger testing',
        })
        .expect(201);

      const flowId = flowResponse.body.data.id;

      // Create a trigger
      const triggerResponse = await request(app)
        .post('/api/triggers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Flow Started Trigger',
          description: 'Trigger when flow is started',
          eventType: 'FLOW_STARTED',
          eventConfig: {},
          conditions: undefined,
          actions: [
            {
              type: 'webhook',
              url: 'https://example.com/webhook',
              method: 'POST',
            },
          ],
          flowId: flowId,
        })
        .expect(201);

      expect(triggerResponse.body).toHaveProperty('success', true);
      expect(triggerResponse.body.data).toHaveProperty('id');
      expect(triggerResponse.body.data.name).toBe('Flow Started Trigger');
      expect(triggerResponse.body.data.eventType).toBe('FLOW_STARTED');
      expect(triggerResponse.body.data.flowId).toBe(flowId);
    });
  });

  describe('List and Get Triggers', () => {
    it('should list triggers for a task', async () => {
      // Create a task
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Task',
        })
        .expect(201);

      const taskId = taskResponse.body.data.id;

      // Create two triggers
      await request(app)
        .post('/api/triggers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Trigger 1',
          eventType: 'TASK_COMPLETED',
          eventConfig: {},
          actions: [
            {
              type: 'email',
              to: 'admin@example.com',
              subject: 'Task Completed',
              body: 'Task has been completed',
            },
          ],
          taskId: taskId,
        })
        .expect(201);

      await request(app)
        .post('/api/triggers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Trigger 2',
          eventType: 'TASK_STARTED',
          eventConfig: {},
          actions: [
            {
              type: 'email',
              to: 'admin@example.com',
              subject: 'Task Started',
              body: 'Task has been started',
            },
          ],
          taskId: taskId,
        })
        .expect(201);

      // List triggers
      const listResponse = await request(app)
        .get(`/api/triggers?taskId=${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(listResponse.body).toHaveProperty('success', true);
      expect(listResponse.body.data).toHaveProperty('triggers');
      expect(Array.isArray(listResponse.body.data.triggers)).toBe(true);
      expect(listResponse.body.data.triggers.length).toBeGreaterThanOrEqual(2);
    });

    it('should get a trigger by ID', async () => {
      // Create a task and trigger
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Task',
        })
        .expect(201);

      const taskId = taskResponse.body.data.id;

      const triggerResponse = await request(app)
        .post('/api/triggers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Trigger',
          eventType: 'TASK_COMPLETED',
          eventConfig: {},
          actions: [
            {
              type: 'email',
              to: 'admin@example.com',
              subject: 'Test',
              body: 'Test action',
            },
          ],
          taskId: taskId,
        })
        .expect(201);

      const triggerId = triggerResponse.body.data.id;

      // Get trigger
      const getResponse = await request(app)
        .get(`/api/triggers/${triggerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body).toHaveProperty('success', true);
      expect(getResponse.body.data.id).toBe(triggerId);
      expect(getResponse.body.data.name).toBe('Test Trigger');
    });
  });

  describe('Update and Delete Triggers', () => {
    it('should update a trigger', async () => {
      // Create a task and trigger
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Task',
        })
        .expect(201);

      const taskId = taskResponse.body.data.id;

      const triggerResponse = await request(app)
        .post('/api/triggers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Original Trigger',
          eventType: 'TASK_COMPLETED',
          eventConfig: {},
          actions: [
            {
              type: 'email',
              to: 'admin@example.com',
              subject: 'Original',
              body: 'Original action',
            },
          ],
          taskId: taskId,
        })
        .expect(201);

      const triggerId = triggerResponse.body.data.id;

      // Update trigger
      const updateResponse = await request(app)
        .put(`/api/triggers/${triggerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Trigger',
          description: 'Updated description',
          isActive: false,
        })
        .expect(200);

      expect(updateResponse.body).toHaveProperty('success', true);
      expect(updateResponse.body.data.name).toBe('Updated Trigger');
      expect(updateResponse.body.data.description).toBe('Updated description');
      expect(updateResponse.body.data.isActive).toBe(false);
    });

    it('should delete a trigger', async () => {
      // Create a task and trigger
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Task',
        })
        .expect(201);

      const taskId = taskResponse.body.data.id;

      const triggerResponse = await request(app)
        .post('/api/triggers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Trigger',
          eventType: 'TASK_COMPLETED',
          eventConfig: {},
          actions: [
            {
              type: 'email',
              to: 'admin@example.com',
              subject: 'Test',
              body: 'Test action',
            },
          ],
          taskId: taskId,
        })
        .expect(201);

      const triggerId = triggerResponse.body.data.id;

      // Delete trigger
      await request(app)
        .delete(`/api/triggers/${triggerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify trigger is deleted
      await request(app)
        .get(`/api/triggers/${triggerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Trigger Execution Logs', () => {
    it('should retrieve execution logs for a trigger', async () => {
      // Create a task and trigger
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Task',
        })
        .expect(201);

      const taskId = taskResponse.body.data.id;

      const triggerResponse = await request(app)
        .post('/api/triggers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Trigger',
          eventType: 'TASK_COMPLETED',
          eventConfig: {},
          actions: [
            {
              type: 'email',
              to: 'admin@example.com',
              subject: 'Test',
              body: 'Test action',
            },
          ],
          taskId: taskId,
        })
        .expect(201);

      const triggerId = triggerResponse.body.data.id;

      // Get execution logs (may be empty if no events have fired)
      const logsResponse = await request(app)
        .get(`/api/triggers/${triggerId}/executions`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(logsResponse.body).toHaveProperty('success', true);
      expect(logsResponse.body.data).toHaveProperty('executions');
      expect(Array.isArray(logsResponse.body.data.executions)).toBe(true);
    });
  });
});

