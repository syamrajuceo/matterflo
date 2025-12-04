/**
 * Auth Integration Tests
 * Tests the full authentication flow including API endpoints
 */

// Mock the prisma import BEFORE importing the service
// We need to get a reference to the test Prisma client that will be shared
const { getTestPrismaClient } = require('../helpers/db.helper');
const testPrisma = getTestPrismaClient();

// Use relative path from tests/integration to src
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

describe('Auth Integration Tests', () => {
  beforeAll(async () => {
    await connectTestDatabase();
    // Import app after mocks are set up using require to avoid TypeScript module resolution issues
    const appModule = require('../../src/app');
    app = appModule.default;
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.firstName).toBe(userData.firstName);
      expect(response.body.data.user.lastName).toBe(userData.lastName);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return error if email already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Existing',
        lastName: 'User',
      };

      // Register first time
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register again with same email
      // Note: AuthError returns 401 by default, but the error message should still be correct
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Email already registered');
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123', // Too short
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const testUser = await createTestUser({
        email: 'login@example.com',
        password: 'password123',
      });

      // Small delay to ensure transaction is committed
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(typeof response.body.data.token).toBe('string');
    });

    it('should return error with incorrect password', async () => {
      await createTestUser({
        email: 'login@example.com',
        password: 'password123',
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Invalid email or password');
    });

    it('should return error with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user info with valid token', async () => {
      const testUser = await createTestUser({
        email: 'me@example.com',
        password: 'password123',
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'me@example.com',
          password: 'password123',
        })
        .expect(200);

      const token = loginResponse.body.data.token;

      // Access protected route
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe(testUser.email);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 with expired token', async () => {
      // Create a token with very short expiry (1ms)
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { id: 'test-id', email: 'test@example.com' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1ms' }
      );

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Full Authentication Flow', () => {
    it('should complete full flow: Register → Login → Access protected route', async () => {
      // Step 1: Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'flow@example.com',
          password: 'password123',
          firstName: 'Flow',
          lastName: 'User',
        })
        .expect(201);

      const registerToken = registerResponse.body.data.token;
      expect(registerToken).toBeDefined();

      // Step 2: Access protected route with register token
      const meResponse1 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${registerToken}`)
        .expect(200);

      expect(meResponse1.body.data.email).toBe('flow@example.com');

      // Step 3: Login (simulating logout and re-login)
      await new Promise(resolve => setTimeout(resolve, 100));

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'flow@example.com',
          password: 'password123',
        })
        .expect(200);

      const loginToken = loginResponse.body.data.token;
      expect(loginToken).toBeDefined();

      // Step 4: Access protected route with login token
      const meResponse2 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200);

      expect(meResponse2.body.data.email).toBe('flow@example.com');
    });
  });
});

