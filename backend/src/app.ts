import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './common/middleware/error.middleware';
import { apiLimiter } from './common/middleware/security.middleware';
import authRoutes from './modules/auth/auth.routes';
import taskRoutes from './modules/tasks/task.routes';
import flowRoutes from './modules/flows/flow.routes';
import triggerRoutes from './modules/triggers/trigger.routes';
import databaseRoutes from './modules/database/database.routes';
import datasetRoutes from './modules/datasets/dataset.routes';
import companyRoutes from './modules/company/company.routes';
import integrationRoutes from './modules/integrations/integration.routes';
import auditRoutes from './modules/audit/audit.routes';
import clientRoutes from './modules/client/client.routes';
import executionRoutes from './modules/execution/execution.routes';
import versionRoutes from './modules/versions/version.routes';
import exportRoutes from './modules/export/export.routes';
import emailRoutes from './modules/email/email.routes';

// Load environment variables
dotenv.config();

const app: Express = express();

// CORS configuration - MUST be before other middleware to handle preflight requests
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // In development, allow any localhost origin (different ports)
    if (process.env.NODE_ENV !== 'production') {
      if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        callback(null, true);
        return;
      }
    }
    
    // In production, use configured CORS_ORIGIN
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : ['http://localhost:5173'];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-company-id'],
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for now (can be configured later)
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting
app.use('/api', apiLimiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/flows', flowRoutes);
app.use('/api/triggers', triggerRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/versions', versionRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/email', emailRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;

