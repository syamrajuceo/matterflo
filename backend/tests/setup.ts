/**
 * Jest setup file
 * Runs before all tests
 */

import dotenv from 'dotenv';

// Load environment variables - try .env.test first, then fallback to .env
dotenv.config({ path: '.env.test' });
// If DATABASE_URL is not set, try loading from .env
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: '.env' });
}

// Set test environment variables if not set
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

// Increase timeout for database operations
// Note: jest.setTimeout is handled in jest.config.js

