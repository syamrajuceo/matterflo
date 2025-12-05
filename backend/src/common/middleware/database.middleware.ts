import { Request, Response, NextFunction } from 'express';
import { isDatabaseConnected } from '../config/database.config';
import { errorResponse } from '../utils/response';

/**
 * Middleware to check database availability before handling API requests
 * Allows health check and Swagger UI endpoints to work without database
 */
export async function requireDatabase(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Skip database check for health and Swagger endpoints
  if (req.path === '/health' || req.path.startsWith('/api-docs')) {
    return next();
  }

  // Check database connection
  const dbConnected = await isDatabaseConnected();
  
  if (!dbConnected) {
    return res.status(503).json(
      errorResponse(
        'SERVICE_UNAVAILABLE',
        'Database is not available. Please ensure PostgreSQL is running and DATABASE_URL is correct.'
      )
    );
  }

  next();
}

