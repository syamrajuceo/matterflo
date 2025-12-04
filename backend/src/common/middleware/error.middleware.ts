import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { Prisma } from '@prisma/client';
import { errorResponse } from '../utils/response';

export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error
  console.error('Error:', error);

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = error as Prisma.PrismaClientKnownRequestError;
    if (prismaError.code === 'P2002') {
      return res.status(409).json(
        errorResponse('DUPLICATE_ENTRY', 'A record with this value already exists')
      );
    }
    if (prismaError.code === 'P2025') {
      return res.status(404).json(
        errorResponse('NOT_FOUND', 'Record not found')
      );
    }
  }

  // Handle Zod validation errors
  if (error.name === 'ZodError' && 'issues' in error) {
    return res.status(400).json(
      errorResponse('VALIDATION_ERROR', 'Validation failed', (error as any).issues)
    );
  }

  // Handle custom AppError
  if (error instanceof AppError) {
    return res.status(error.statusCode).json(
      errorResponse(error.code, error.message, error.details)
    );
  }


  // Handle unknown errors
  return res.status(500).json(
    errorResponse(
      'INTERNAL_SERVER_ERROR',
      process.env.NODE_ENV === 'production' 
        ? 'An internal server error occurred' 
        : error.message
    )
  );
}

