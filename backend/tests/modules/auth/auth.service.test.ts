/**
 * Auth Service Tests
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

import { authService } from '../../../src/modules/auth/auth.service';
import { connectTestDatabase, disconnectTestDatabase, cleanDatabase } from '../../helpers/db.helper';
import { createTestUser } from '../../helpers/auth.helper';

describe('AuthService', () => {

  beforeAll(async () => {
    await connectTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };

      const result = await authService.register(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(userData.email);
      expect(result.user.firstName).toBe(userData.firstName);
      expect(result.user.lastName).toBe(userData.lastName);
      // Password should not be in the response (IUser doesn't include password)
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Existing',
        lastName: 'User',
      };

      await authService.register(userData);

      await expect(authService.register(userData)).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    it('should login with correct credentials', async () => {
      const testUser = await createTestUser({
        email: 'login@example.com',
        password: 'password123',
      });

      // Ensure transaction is committed and user is visible
      // by querying directly with the test Prisma client
      const { getTestPrismaClient } = require('../../helpers/db.helper');
      const testPrisma = getTestPrismaClient();
      const verifyUser = await testPrisma.user.findUnique({
        where: { email: 'login@example.com' },
      });
      if (!verifyUser) {
        throw new Error('User was not created in database');
      }

      // Small delay to ensure all database connections see the committed transaction
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = await authService.login('login@example.com', 'password123');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(testUser.email);
    });

    it('should throw error with incorrect password', async () => {
      await createTestUser({
        email: 'login@example.com',
        password: 'password123',
      });

      await expect(
        authService.login('login@example.com', 'wrongpassword')
      ).rejects.toThrow();
    });

    it('should throw error with non-existent email', async () => {
      await expect(
        authService.login('nonexistent@example.com', 'password123')
      ).rejects.toThrow();
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      await createTestUser({
        email: 'verify@example.com',
        password: 'password123',
      });

      const loginResult = await authService.login('verify@example.com', 'password123');

      const user = await authService.verifyToken(loginResult.token);

      expect(user).toHaveProperty('id');
      expect(user.email).toBe('verify@example.com');
    });

    it('should throw error with invalid token', async () => {
      await expect(authService.verifyToken('invalid-token')).rejects.toThrow();
    });
  });
});

