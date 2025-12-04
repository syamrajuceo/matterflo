# MEGA PROMPT DOCUMENT - PART 1
# Project Setup, Authentication & Task Builder

**Days 1-41 | Foundation Phase**

---

## 🎯 Overview

This document contains **precise, copy-paste prompts** for Cursor AI to build the ERP Builder foundation:
- Project initialization
- Authentication system
- Task Builder (backend + frontend)
- Testing for each component

**Each prompt includes:**
1. Detailed requirements
2. Expected file structure
3. Code specifications
4. Testing instructions

---

## 📅 DAY 1-2: PROJECT INITIALIZATION

### PROMPT 1.1: Backend Project Setup

```
Create a Node.js + Express + TypeScript backend:

Initialize project in backend/ folder:

1. Create package.json:
{
  "name": "erp-builder-backend",
  "version": "1.0.0",
  "main": "dist/server.js",
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write 'src/**/*.ts'"
  }
}

2. Install dependencies:
npm install express cors dotenv bcrypt jsonwebtoken winston
npm install @prisma/client
npm install -D typescript @types/node @types/express @types/cors @types/bcrypt @types/jsonwebtoken
npm install -D ts-node nodemon prisma
npm install -D jest @types/jest ts-jest supertest @types/supertest
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier

3. Create tsconfig.json:
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}

4. Create .env:
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:password@localhost:5432/erpbuilder"
REDIS_URL="redis://localhost:6379"
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
FILE_UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

5. Create folder structure:
backend/
├── src/
│   ├── modules/
│   │   └── (empty for now)
│   ├── common/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── utils/
│   │   ├── errors/
│   │   └── types/
│   ├── prisma/
│   ├── app.ts
│   └── server.ts
├── tests/
├── .env
├── .env.example
├── tsconfig.json
├── package.json
└── .gitignore

6. Create src/app.ts:
- Initialize Express app
- Add CORS middleware (allow CORS_ORIGIN)
- Add JSON body parser (limit: 10mb)
- Add request logging middleware
- Add error handling middleware
- Export app

7. Create src/server.ts:
- Import app
- Start server on PORT from .env
- Log server start
- Handle graceful shutdown

8. Create .gitignore:
node_modules/
dist/
.env
uploads/
*.log
coverage/
.DS_Store

Requirements:
- Use TypeScript strict mode
- All imports must be typed
- Use async/await (not callbacks)
- Add proper error handling
- Add console logging
```

**TESTING PROMPT 1.1:**
```bash
# After Cursor generates code:

cd backend
npm install
npm run dev

# Expected output:
# ✓ Server running on port 3000
# ✓ Environment: development

# Test:
curl http://localhost:3000

# Should respond (even if 404, server is working)
```

---

### PROMPT 1.2: Common Utilities Setup

```
Create common utilities in backend/src/common/:

1. Create utils/logger.ts:
import winston from 'winston';

Export logger with:
- Console transport (development)
- File transport (production)
- JSON format
- Levels: error, warn, info, debug
- Include timestamp, level, message, metadata

2. Create utils/response.ts:
Export functions:
- successResponse(data, message?)
  Returns: { success: true, data, message?, meta: { timestamp } }
  
- errorResponse(code, message, details?)
  Returns: { success: false, error: { code, message, details? }, meta: { timestamp } }

3. Create errors/AppError.ts:
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    public message: string,
    public details?: any
  )
}

4. Create errors/ValidationError.ts:
class ValidationError extends AppError {
  constructor(message: string, details: any)
  - statusCode: 400
  - code: 'VALIDATION_ERROR'
}

5. Create errors/AuthError.ts:
class AuthError extends AppError {
  constructor(message: string)
  - statusCode: 401
  - code: 'AUTH_ERROR'
}

6. Create errors/NotFoundError.ts:
class NotFoundError extends AppError {
  constructor(entity: string)
  - statusCode: 404
  - code: 'NOT_FOUND'
  - message: `${entity} not found`
}

7. Create errors/index.ts:
Export all error classes

8. Create middleware/error.middleware.ts:
Export errorHandler middleware:
- Catch all errors
- Log with logger
- Send appropriate response
- Handle Prisma errors
- Handle validation errors

9. Create middleware/logger.middleware.ts:
Export requestLogger middleware:
- Log all requests
- Include: method, path, status, duration
- Use winston logger

10. Update src/app.ts:
- Import and use requestLogger middleware
- Import and use errorHandler middleware (last)

Requirements:
- Proper TypeScript types
- Winston for logging
- Centralized error handling
- Request/response logging
```

**TESTING PROMPT 1.2:**
```bash
# Test logging:
curl http://localhost:3000/test

# Check console - should see:
# [INFO] GET /test 404 12ms

# Test error handling:
# Trigger an error in code (e.g., throw new Error('test'))
# Should see formatted error response
```

---

## 📅 DAY 3-5: PRISMA & DATABASE SETUP

### PROMPT 1.3: Prisma Initialization

```
Set up Prisma ORM in backend/:

1. Initialize Prisma:
npx prisma init

2. Update backend/prisma/schema.prisma:
Copy the COMPLETE schema from the document "02_DATABASE_SCHEMA.md"

Important models to include:
- User, Company, Department, Role
- Task, TaskExecution
- Flow, FlowLevel, FlowInstance, FlowBranch
- Trigger, TriggerExecution
- CustomTable, CustomTableRecord
- Integration, Dataset
- AuditLog, Version, File, EmailTemplate

3. Create backend/prisma/seed.ts:
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

Seed data:
- 1 company (Acme Corporation)
- 3 users (developer@erpbuilder.com, admin@acme.com, employee@acme.com)
- 2 departments (Engineering, Finance)
- 2 roles (Manager, Employee)
- 1 sample task (Expense Approval Form)
- 1 sample flow (Expense Approval Workflow with 3 levels)
- 1 sample trigger (High-Value Alert)
- 2 email templates

4. Add to package.json:
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}

5. Run migrations:
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed

6. Create backend/src/common/config/database.config.ts:
import { PrismaClient } from '@prisma/client';

Export:
- prisma singleton instance
- connectDatabase function
- disconnectDatabase function

7. Update server.ts:
- Import and call connectDatabase on startup
- Add graceful shutdown (disconnect on SIGTERM)

Requirements:
- Use ALL models from schema document
- Proper indexes
- Seed realistic sample data
- Connection pooling
- Error handling
```

**TESTING PROMPT 1.3:**
```bash
# Run migration:
cd backend
npx prisma migrate dev --name init

# Expected:
# ✓ Migration applied successfully
# ✓ Prisma Client generated

# Seed database:
npm run prisma:seed

# Expected:
# ✓ Database seeded successfully!

# Verify in Prisma Studio:
npx prisma studio

# Should see:
# - 1 company
# - 3 users
# - Sample task and flow

# Test database connection:
npm run dev
# Should start without errors
```

---

## 📅 DAY 6-10: AUTHENTICATION MODULE

### PROMPT 1.4: Authentication Backend

```
Create authentication module in backend/src/modules/auth/:

File structure:
backend/src/modules/auth/
├── auth.types.ts
├── auth.validation.ts
├── auth.service.ts
├── auth.controller.ts
├── auth.middleware.ts
└── auth.routes.ts

1. auth.types.ts:
export interface IUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'DEVELOPER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  companyId: string | null;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export interface IAuthResponse {
  token: string;
  user: IUser;
}

2. auth.validation.ts:
import { z } from 'zod';

Export schemas:
- loginSchema: email (valid email), password (min 6 chars)
- registerSchema: email, password (min 6), firstName, lastName

3. auth.service.ts:
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../common/config/database.config';

class AuthService {
  async register(data: IRegisterRequest): Promise<IAuthResponse> {
    // Check if email exists
    // Hash password (10 rounds)
    // Create user in database
    // Generate JWT token
    // Return token and user (without password)
  }

  async login(email: string, password: string): Promise<IAuthResponse> {
    // Find user by email
    // Verify password with bcrypt.compare
    // Update lastLogin
    // Generate JWT token
    // Return token and user (without password)
  }

  async verifyToken(token: string): Promise<IUser> {
    // Verify JWT
    // Get user from database
    // Return user
  }

  private generateToken(user: IUser): string {
    // Sign JWT with user id and email
    // Use JWT_SECRET from env
    // Set expiry from JWT_EXPIRES_IN
  }
}

export const authService = new AuthService();

4. auth.controller.ts:
import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { successResponse } from '../../common/utils/response';

class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(successResponse(result, 'User registered successfully'));
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json(successResponse(result, 'Login successful'));
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      // req.user is set by auth middleware
      res.json(successResponse(req.user));
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();

5. auth.middleware.ts:
import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { AuthError } from '../../common/errors';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new AuthError('No token provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await authService.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    next(new AuthError('Invalid token'));
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthError('Not authenticated'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AuthError('Insufficient permissions'));
    }
    next();
  };
}

6. auth.routes.ts:
import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticateToken } from './auth.middleware';
import { validate } from '../../common/middleware/validation.middleware';
import { loginSchema, registerSchema } from './auth.validation';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticateToken, authController.me);

export default router;

7. Create common/middleware/validation.middleware.ts:
import { z } from 'zod';
import { ValidationError } from '../errors';

export function validate(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Validation failed', error.errors));
      } else {
        next(error);
      }
    }
  };
}

8. Update src/app.ts:
import authRoutes from './modules/auth/auth.routes';
app.use('/api/auth', authRoutes);

Requirements:
- Use bcrypt for password hashing (10 rounds)
- Use JWT for tokens
- Validate inputs with Zod
- Proper error handling
- Type safety
- Never return password in responses
```

**TESTING PROMPT 1.4:**
```bash
# Test registration:
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Expected response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "...",
      "email": "test@test.com",
      "firstName": "Test",
      "lastName": "User",
      "role": "EMPLOYEE"
    }
  },
  "message": "User registered successfully"
}

# Test login:
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "password123"
  }'

# Expected: Same response structure with token

# Test protected route:
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Expected: User object

# Test invalid token:
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer invalid_token"

# Expected:
{
  "success": false,
  "error": {
    "code": "AUTH_ERROR",
    "message": "Invalid token"
  }
}

# Verify in database:
npx prisma studio
# Check users table - should see new user
# Password should be hashed
```

---

### PROMPT 1.5: Authentication Frontend

```
Create authentication UI in frontend/src/features/auth/:

File structure:
frontend/src/features/auth/
├── components/
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   └── ProtectedRoute.tsx
├── services/
│   └── auth.service.ts
├── store/
│   └── authStore.ts
└── types/
    └── auth.types.ts

1. types/auth.types.ts:
export interface IUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  companyId: string | null;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface IAuthResponse {
  token: string;
  user: IUser;
}

2. services/auth.service.ts:
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class AuthService {
  async login(email: string, password: string): Promise<IAuthResponse> {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });
    return response.data.data;
  }

  async register(data: IRegisterRequest): Promise<IAuthResponse> {
    const response = await axios.post(`${API_URL}/auth/register`, data);
    return response.data.data;
  }

  async me(token: string): Promise<IUser> {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  }

  logout(): void {
    localStorage.removeItem('token');
  }
}

export const authService = new AuthService();

3. store/authStore.ts:
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: IUser, token: string) => void;
  clearAuth: () => void;
  setUser: (user: IUser) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true }),
      clearAuth: () =>
        set({ user: null, token: null, isAuthenticated: false }),
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

4. components/LoginForm.tsx:
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export function LoginForm() {
  const { register, handleSubmit, formState: { errors }, setError } = useForm({
    resolver: zodResolver(loginSchema),
  });
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      const response = await authService.login(data.email, data.password);
      setAuth(response.user, response.token);
      navigate('/dashboard');
    } catch (error: any) {
      setError('root', {
        message: error.response?.data?.error?.message || 'Login failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1419]">
      <div className="w-full max-w-md p-8 bg-[#1A1F2E] rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-6">Login to ERP Builder</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              className="w-full px-4 py-2 bg-[#252D3D] text-white border border-[#374151] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              {...register('password')}
              type="password"
              className="w-full px-4 py-2 bg-[#252D3D] text-white border border-[#374151] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          {errors.root && (
            <div className="p-3 bg-red-500/10 border border-red-500 rounded-md">
              <p className="text-red-500 text-sm">{errors.root.message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-400 text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-500 hover:text-blue-400">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

5. components/RegisterForm.tsx:
Similar to LoginForm but with:
- firstName and lastName fields
- Call authService.register
- Navigate to /login after success
- Link to login page

6. components/ProtectedRoute.tsx:
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user && !requiredRole.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

7. Update src/App.tsx:
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginForm } from './features/auth/components/LoginForm';
import { RegisterForm } from './features/auth/components/RegisterForm';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

8. Create simple Dashboard.tsx:
export function Dashboard() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0F1419] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">
            Welcome, {user?.firstName || user?.email}!
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
          >
            Logout
          </button>
        </div>
        <div className="bg-[#1A1F2E] p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Dashboard</h2>
          <p className="text-gray-400">Your dashboard content goes here...</p>
        </div>
      </div>
    </div>
  );
}

Requirements:
- Dark theme colors
- Form validation with react-hook-form + zod
- Error handling
- Loading states
- Responsive design
- Type safety
```

**TESTING PROMPT 1.5:**
```bash
# Start frontend:
cd frontend
npm run dev

# Manual testing:
1. Open http://localhost:5173
2. Should redirect to /login
3. See login form with dark theme
4. Click "Register" link
5. Fill registration form
6. Submit - should redirect to login
7. Login with credentials
8. Should redirect to /dashboard
9. Should see welcome message
10. Click logout - should go back to login
11. Try accessing /dashboard directly (logged out)
    - Should redirect to /login

# Test validation:
1. Try empty email - should show error
2. Try invalid email - should show error
3. Try short password - should show error

# Test localStorage:
1. Login
2. Open DevTools → Application → Local Storage
3. Should see 'auth-storage' with token and user
4. Refresh page
5. Should stay logged in

# Test wrong credentials:
1. Enter wrong password
2. Should show error message
```

---

## 📅 DAY 15-35: TASK BUILDER (Backend + Frontend)

### PROMPT 3.1: Task Builder Backend - Models & Service

```
Create Task Builder backend in backend/src/modules/tasks/:

1. task.types.ts - TypeScript interfaces:

export interface ITaskField {
  id: string;
  type: 'text' | 'number' | 'date' | 'dropdown' | 'multi-select' | 'checkbox' | 'file' | 'image' | 'rich-text' | 'field-group';
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[]; // for dropdown/multi-select
  };
  conditionalLogic?: {
    showIf: {
      fieldId: string;
      operator: 'equals' | 'not_equals' | 'contains';
      value: any;
    }[];
  };
  order: number;
}

export interface ITask {
  id: string;
  name: string;
  description?: string;
  version: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  fields: ITaskField[];
  validations: any[];
  logic: any;
  companyId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

2. task.validation.ts - Zod schemas:
- createTaskSchema
- updateTaskSchema
- taskFieldSchema

3. task.service.ts - CRUD operations:

class TaskService {
  // Create new task
  async createTask(data: {
    name: string;
    description?: string;
    companyId: string;
    createdById: string;
  }): Promise<ITask> {
    // Create with default fields: []
    // Status: DRAFT
    // Version: 1.0
  }

  // Get task by ID
  async getTask(id: string): Promise<ITask | null> {
    // Include all fields
  }

  // List tasks with filters
  async listTasks(filters: {
    companyId: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    tasks: ITask[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    // Paginated results
    // Default: 20 per page
  }

  // Update task
  async updateTask(id: string, data: Partial<ITask>): Promise<ITask> {
    // Can update: name, description, fields, logic
    // Cannot update if status is PUBLISHED
  }

  // Add field to task
  async addField(taskId: string, field: ITaskField): Promise<ITask> {
    // Generate unique field ID
    // Set order to last + 1
    // Update task
  }

  // Update field
  async updateField(taskId: string, fieldId: string, data: Partial<ITaskField>): Promise<ITask> {
    // Find field and update
  }

  // Delete field
  async deleteField(taskId: string, fieldId: string): Promise<ITask> {
    // Remove field
    // Reorder remaining fields
  }

  // Reorder fields
  async reorderFields(taskId: string, fieldIds: string[]): Promise<ITask> {
    // Update field order based on array
  }

  // Publish task
  async publishTask(id: string): Promise<ITask> {
    // Change status to PUBLISHED
    // Set publishedAt timestamp
    // Cannot unpublish (create new version instead)
  }

  // Delete task (soft delete)
  async deleteTask(id: string): Promise<void> {
    // Set status to ARCHIVED
  }

  // Duplicate task
  async duplicateTask(id: string, newName: string): Promise<ITask> {
    // Copy all fields
    // Status: DRAFT
    // New version
  }
}

Use Prisma for database operations
Add error handling (try-catch)
Add logging with Winston     
```

**TESTING PROMPT 3.1:**
```bash
# Create test file: backend/test-task-service.ts

import { TaskService } from './modules/tasks/task.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const taskService = new TaskService(prisma);

async function test() {
  // 1. Create task
  const task = await taskService.createTask({
    name: 'Employee Onboarding Form',
    description: 'New employee information',
    companyId: 'test-company-id',
    createdById: 'test-user-id'
  });
  console.log('✓ Task created:', task.id);

  // 2. Add text field
  await taskService.addField(task.id, {
    id: '', // will be generated
    type: 'text',
    label: 'Full Name',
    required: true,
    order: 0
  });
  console.log('✓ Field added');

  // 3. Add number field
  await taskService.addField(task.id, {
    id: '',
    type: 'number',
    label: 'Employee ID',
    required: true,
    validation: { min: 1000, max: 9999 },
    order: 0
  });
  console.log('✓ Number field added');

  // 4. Get task
  const updated = await taskService.getTask(task.id);
  console.log('✓ Task retrieved, fields:', updated?.fields.length);

  // 5. List tasks
  const list = await taskService.listTasks({
    companyId: 'test-company-id',
    page: 1,
    limit: 10
  });
  console.log('✓ Tasks listed:', list.total);

  // 6. Publish task
  await taskService.publishTask(task.id);
  console.log('✓ Task published');
}

test().catch(console.error);

# Run: ts-node backend/test-task-service.ts
```

---

### PROMPT 3.2: Task Builder Backend - Controller & Routes

```
Create Task Builder API endpoints in backend/src/modules/tasks/:

1. task.controller.ts:

import { Request, Response, NextFunction } from 'express';
import { TaskService } from './task.service';

export class TaskController {
  constructor(private taskService: TaskService) {}

  // POST /api/tasks
  createTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description } = req.body;
      const companyId = req.user.companyId;
      const createdById = req.user.id;

      const task = await this.taskService.createTask({
        name,
        description,
        companyId,
        createdById
      });

      res.status(201).json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/tasks
  listTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, search, page = '1', limit = '20' } = req.query;
      const companyId = req.user.companyId;

      const result = await this.taskService.listTasks({
        companyId,
        status: status as string,
        search: search as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/tasks/:id
  getTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const task = await this.taskService.getTask(id);

      if (!task) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Task not found' }
        });
      }

      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/tasks/:id
  updateTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const task = await this.taskService.updateTask(id, req.body);

      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/tasks/:id/fields
  addField = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const task = await this.taskService.addField(id, req.body);

      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/tasks/:id/fields/:fieldId
  updateField = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, fieldId } = req.params;
      const task = await this.taskService.updateField(id, fieldId, req.body);

      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/tasks/:id/fields/:fieldId
  deleteField = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, fieldId } = req.params;
      const task = await this.taskService.deleteField(id, fieldId);

      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/tasks/:id/fields/reorder
  reorderFields = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { fieldIds } = req.body;
      const task = await this.taskService.reorderFields(id, fieldIds);

      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/tasks/:id/publish
  publishTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const task = await this.taskService.publishTask(id);

      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/tasks/:id
  deleteTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.taskService.deleteTask(id);

      res.json({
        success: true,
        data: null
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/tasks/:id/duplicate
  duplicateTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const task = await this.taskService.duplicateTask(id, name);

      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  };
}

2. task.routes.ts:

import { Router } from 'express';
import { TaskController } from './task.controller';
import { authenticateToken } from '../auth/auth.middleware';
import { validate } from '../../common/middleware/validation.middleware';
import { createTaskSchema, updateTaskSchema } from './task.validation';

const router = Router();
const taskController = new TaskController(taskService);

// All routes require authentication
router.use(authenticateToken);

router.post('/', validate(createTaskSchema), taskController.createTask);
router.get('/', taskController.listTasks);
router.get('/:id', taskController.getTask);
router.put('/:id', validate(updateTaskSchema), taskController.updateTask);
router.post('/:id/fields', taskController.addField);
router.put('/:id/fields/:fieldId', taskController.updateField);
router.delete('/:id/fields/:fieldId', taskController.deleteField);
router.put('/:id/fields/reorder', taskController.reorderFields);
router.post('/:id/publish', taskController.publishTask);
router.delete('/:id', taskController.deleteTask);
router.post('/:id/duplicate', taskController.duplicateTask);

export default router;

3. Register routes in backend/src/app.ts:
import taskRoutes from './modules/tasks/task.routes';
app.use('/api/tasks', taskRoutes);
```

**TESTING PROMPT 3.2:**
```bash
# Test all endpoints with curl:

# 1. Create task
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Task", "description": "Test description"}'

# 2. List tasks
curl http://localhost:3000/api/tasks \
  -H "Authorization: Bearer $TOKEN"

# 3. Get task
curl http://localhost:3000/api/tasks/<TASK_ID> \
  -H "Authorization: Bearer $TOKEN"

# 4. Add field
curl -X POST http://localhost:3000/api/tasks/<TASK_ID>/fields \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "label": "Full Name",
    "required": true
  }'

# 5. Update field
curl -X PUT http://localhost:3000/api/tasks/<TASK_ID>/fields/<FIELD_ID> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"label": "Employee Full Name"}'

# 6. Reorder fields
curl -X PUT http://localhost:3000/api/tasks/<TASK_ID>/fields/reorder \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fieldIds": ["field2", "field1", "field3"]}'

# 7. Publish task
curl -X POST http://localhost:3000/api/tasks/<TASK_ID>/publish \
  -H "Authorization: Bearer $TOKEN"

# 8. Duplicate task
curl -X POST http://localhost:3000/api/tasks/<TASK_ID>/duplicate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Copy of Test Task"}'

# All should return success: true
```

---

### PROMPT 3.3: Task Builder Frontend - State Management

```
Create Task Builder state management in frontend/src/features/task-builder/:

1. Create folder structure:
task-builder/
├── components/
│   ├── TaskBuilder.tsx
│   ├── TaskList.tsx
│   ├── FieldPalette.tsx
│   ├── FormCanvas.tsx
│   ├── FieldPropertiesPanel.tsx
│   ├── TaskPreview.tsx
│   └── field-types/
│       ├── TextField.tsx
│       ├── NumberField.tsx
│       ├── DateField.tsx
│       ├── DropdownField.tsx
│       └── ... (other field types)
├── hooks/
│   ├── useTaskBuilder.ts
│   └── useFieldValidation.ts
├── store/
│   └── taskBuilderStore.ts
├── services/
│   └── task.service.ts
└── types/
    └── task.types.ts

2. task.types.ts - Frontend types:

export interface ITaskField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: FieldValidation;
  conditionalLogic?: ConditionalLogic;
  order: number;
}

export type FieldType = 
  | 'text'
  | 'number'
  | 'date'
  | 'dropdown'
  | 'multi-select'
  | 'checkbox'
  | 'file'
  | 'image'
  | 'rich-text'
  | 'field-group';

export interface ITask {
  id: string;
  name: string;
  description?: string;
  version: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  fields: ITaskField[];
  createdAt: string;
  updatedAt: string;
}

3. task.service.ts - API calls:

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const taskService = {
  async createTask(data: { name: string; description?: string }) {
    const response = await axios.post(`${API_URL}/tasks`, data);
    return response.data.data;
  },

  async listTasks(params?: { status?: string; search?: string; page?: number }) {
    const response = await axios.get(`${API_URL}/tasks`, { params });
    return response.data.data;
  },

  async getTask(id: string) {
    const response = await axios.get(`${API_URL}/tasks/${id}`);
    return response.data.data;
  },

  async updateTask(id: string, data: Partial<ITask>) {
    const response = await axios.put(`${API_URL}/tasks/${id}`, data);
    return response.data.data;
  },

  async addField(taskId: string, field: Partial<ITaskField>) {
    const response = await axios.post(`${API_URL}/tasks/${taskId}/fields`, field);
    return response.data.data;
  },

  async updateField(taskId: string, fieldId: string, data: Partial<ITaskField>) {
    const response = await axios.put(`${API_URL}/tasks/${taskId}/fields/${fieldId}`, data);
    return response.data.data;
  },

  async deleteField(taskId: string, fieldId: string) {
    const response = await axios.delete(`${API_URL}/tasks/${taskId}/fields/${fieldId}`);
    return response.data.data;
  },

  async reorderFields(taskId: string, fieldIds: string[]) {
    const response = await axios.put(`${API_URL}/tasks/${taskId}/fields/reorder`, { fieldIds });
    return response.data.data;
  },

  async publishTask(id: string) {
    const response = await axios.post(`${API_URL}/tasks/${id}/publish`);
    return response.data.data;
  },

  async deleteTask(id: string) {
    await axios.delete(`${API_URL}/tasks/${id}`);
  },

  async duplicateTask(id: string, name: string) {
    const response = await axios.post(`${API_URL}/tasks/${id}/duplicate`, { name });
    return response.data.data;
  }
};

4. taskBuilderStore.ts - Zustand store:

import { create } from 'zustand';
import { ITask, ITaskField } from '../types/task.types';

interface TaskBuilderState {
  // Current task being edited
  currentTask: ITask | null;
  setCurrentTask: (task: ITask | null) => void;

  // Selected field for editing
  selectedField: ITaskField | null;
  setSelectedField: (field: ITaskField | null) => void;

  // Unsaved changes flag
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;

  // Field being dragged
  draggedField: ITaskField | null;
  setDraggedField: (field: ITaskField | null) => void;

  // Preview mode
  isPreviewMode: boolean;
  setIsPreviewMode: (value: boolean) => void;

  // Actions
  addField: (field: ITaskField) => void;
  updateField: (fieldId: string, updates: Partial<ITaskField>) => void;
  deleteField: (fieldId: string) => void;
  reorderFields: (fieldIds: string[]) => void;
}

export const useTaskBuilderStore = create<TaskBuilderState>((set, get) => ({
  currentTask: null,
  setCurrentTask: (task) => set({ currentTask: task }),

  selectedField: null,
  setSelectedField: (field) => set({ selectedField: field }),

  hasUnsavedChanges: false,
  setHasUnsavedChanges: (value) => set({ hasUnsavedChanges: value }),

  draggedField: null,
  setDraggedField: (field) => set({ draggedField: field }),

  isPreviewMode: false,
  setIsPreviewMode: (value) => set({ isPreviewMode: value }),

  addField: (field) => set((state) => {
    if (!state.currentTask) return state;
    return {
      currentTask: {
        ...state.currentTask,
        fields: [...state.currentTask.fields, field]
      },
      hasUnsavedChanges: true
    };
  }),

  updateField: (fieldId, updates) => set((state) => {
    if (!state.currentTask) return state;
    return {
      currentTask: {
        ...state.currentTask,
        fields: state.currentTask.fields.map(f =>
          f.id === fieldId ? { ...f, ...updates } : f
        )
      },
      hasUnsavedChanges: true
    };
  }),

  deleteField: (fieldId) => set((state) => {
    if (!state.currentTask) return state;
    return {
      currentTask: {
        ...state.currentTask,
        fields: state.currentTask.fields.filter(f => f.id !== fieldId)
      },
      hasUnsavedChanges: true
    };
  }),

  reorderFields: (fieldIds) => set((state) => {
    if (!state.currentTask) return state;
    const fields = fieldIds.map(id =>
      state.currentTask!.fields.find(f => f.id === id)!
    );
    return {
      currentTask: {
        ...state.currentTask,
        fields
      },
      hasUnsavedChanges: true
    };
  })
}));
```

**TESTING PROMPT 3.3:**
```bash
# No manual testing yet - this is just state setup
# Continue to next prompt for UI components
```

---

## ✅ PART 1 COMPLETE

This completes Days 1-41 covering:
- ✅ Project initialization
- ✅ Authentication system (backend + frontend)
- ✅ Task Builder (backend + frontend state)

**Remaining for Task Builder (covered in visual component prompts):**
- Task Builder UI components (in next prompts if needed)
- Drag and drop functionality
- Field property panel
- Task preview

**Continue to 03_MEGA_PROMPT_PART2.md for Flow Builder (Days 42-90)**

---
