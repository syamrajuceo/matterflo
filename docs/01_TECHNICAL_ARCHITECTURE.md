# Technical Architecture Document
# ERP Builder - Developer Edition (Phase 1 MVP)

**Version:** 1.0  
**Date:** November 2025  
**Status:** Development Ready

---

## 1. System Overview

### 1.1 Architecture Pattern
**Monolithic Application with Modular Structure**
- Single codebase for Phase 1 MVP
- Clear separation of concerns
- Easy to scale to microservices in Phase 2

### 1.2 Technology Stack

#### Frontend
```
Framework: React 18.x
Language: TypeScript 5.x
Build Tool: Vite 5.x
State Management: Zustand 4.x
Routing: React Router v6
UI Components: shadcn/ui (Radix UI + Tailwind)
Styling: Tailwind CSS 3.x
Form Management: React Hook Form + Zod
Drag & Drop: @dnd-kit/core
Flow Visualization: ReactFlow 11.x
Rich Text: Tiptap
Date Picker: react-day-picker
Charts: Recharts
Icons: Lucide React
HTTP Client: Axios
```

#### Backend
```
Runtime: Node.js 20.x LTS
Framework: Express.js 4.x
Language: TypeScript 5.x
ORM: Prisma 5.x
Validation: Zod
Authentication: JWT (jsonwebtoken)
Password Hashing: bcrypt
Email: Nodemailer
File Upload: Multer
Logging: Winston
Environment: dotenv
CORS: cors
Rate Limiting: express-rate-limit
```

#### Database
```
Primary Database: PostgreSQL 16.x
Cache/Events: Redis 7.x
File Storage: Local filesystem (Phase 1) / S3 (Phase 2)
```

#### Development Tools
```
Package Manager: npm / pnpm
Code Quality: ESLint + Prettier
Git Hooks: Husky + lint-staged
Testing: Jest + React Testing Library
E2E Testing: Playwright
API Testing: Supertest
```

---

## 2. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │  Developer       │         │  Client          │        │
│  │  Console         │         │  Portal          │        │
│  │  (React SPA)     │         │  (React SPA)     │        │
│  └────────┬─────────┘         └────────┬─────────┘        │
│           │                            │                   │
│           └────────────┬───────────────┘                   │
│                        │                                   │
└────────────────────────┼───────────────────────────────────┘
                         │
                         │ HTTPS/REST API
                         │
┌────────────────────────┼───────────────────────────────────┐
│                   API GATEWAY LAYER                         │
├────────────────────────┼───────────────────────────────────┤
│                        │                                   │
│              ┌─────────▼──────────┐                        │
│              │  Express.js Server │                        │
│              │  - Auth Middleware │                        │
│              │  - CORS            │                        │
│              │  - Rate Limiting   │                        │
│              │  - Request Logging │                        │
│              └─────────┬──────────┘                        │
└────────────────────────┼───────────────────────────────────┘
                         │
┌────────────────────────┼───────────────────────────────────┐
│                  APPLICATION LAYER                          │
├────────────────────────┼───────────────────────────────────┤
│                        │                                   │
│  ┌─────────────────────┴─────────────────────┐            │
│  │          Controller Layer                  │            │
│  │  (Route Handlers + Input Validation)       │            │
│  └─────────────────────┬─────────────────────┘            │
│                        │                                   │
│  ┌─────────────────────┴─────────────────────┐            │
│  │          Service Layer                     │            │
│  │  (Business Logic)                          │            │
│  │                                            │            │
│  │  ┌───────────┐  ┌──────────┐  ┌─────────┐│            │
│  │  │   Task    │  │   Flow   │  │ Trigger ││            │
│  │  │  Service  │  │  Engine  │  │ Engine  ││            │
│  │  └───────────┘  └──────────┘  └─────────┘│            │
│  │                                            │            │
│  │  ┌───────────┐  ┌──────────┐  ┌─────────┐│            │
│  │  │ Database  │  │  Dataset │  │  Email  ││            │
│  │  │  Service  │  │  Service │  │ Service ││            │
│  │  └───────────┘  └──────────┘  └─────────┘│            │
│  └────────────────────────────────────────────┘            │
│                        │                                   │
│  ┌─────────────────────┴─────────────────────┐            │
│  │          Data Access Layer                 │            │
│  │  (Prisma ORM)                             │            │
│  └─────────────────────┬─────────────────────┘            │
└────────────────────────┼───────────────────────────────────┘
                         │
┌────────────────────────┼───────────────────────────────────┐
│                    DATA LAYER                               │
├────────────────────────┼───────────────────────────────────┤
│                        │                                   │
│    ┌───────────────────▼──────────────┐                   │
│    │     PostgreSQL Database          │                   │
│    │  - User Data                     │                   │
│    │  - Tasks, Flows, Triggers        │                   │
│    │  - Database Schema & Records     │                   │
│    │  - Audit Logs                    │                   │
│    └──────────────────────────────────┘                   │
│                                                            │
│    ┌──────────────────────────────────┐                   │
│    │     Redis Cache/Queue            │                   │
│    │  - Event Bus (Redis Streams)     │                   │
│    │  - Session Storage               │                   │
│    │  - Trigger Queue                 │                   │
│    └──────────────────────────────────┘                   │
│                                                            │
│    ┌──────────────────────────────────┐                   │
│    │     File Storage                 │                   │
│    │  - Uploaded Files                │                   │
│    │  - Generated PDFs                │                   │
│    │  - Task Attachments              │                   │
│    └──────────────────────────────────┘                   │
└────────────────────────────────────────────────────────────┘


┌────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │  Gmail   │  │ Webhooks │  │  SMTP    │               │
│  │   API    │  │(Incoming)│  │  Server  │               │
│  └──────────┘  └──────────┘  └──────────┘               │
└────────────────────────────────────────────────────────────┘
```

---

## 3. Folder Structure

### 3.1 Complete Project Structure

```
erp-builder/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── auth.types.ts
│   │   │   │   └── auth.validation.ts
│   │   │   │
│   │   │   ├── tasks/
│   │   │   │   ├── task.controller.ts
│   │   │   │   ├── task.service.ts
│   │   │   │   ├── task.routes.ts
│   │   │   │   ├── task.types.ts
│   │   │   │   └── task.validation.ts
│   │   │   │
│   │   │   ├── flows/
│   │   │   │   ├── flow.controller.ts
│   │   │   │   ├── flow.service.ts
│   │   │   │   ├── flow.engine.ts           # Core flow execution
│   │   │   │   ├── flow.routes.ts
│   │   │   │   ├── flow.types.ts
│   │   │   │   └── flow.validation.ts
│   │   │   │
│   │   │   ├── triggers/
│   │   │   │   ├── trigger.controller.ts
│   │   │   │   ├── trigger.service.ts
│   │   │   │   ├── trigger.evaluator.ts     # Condition evaluation
│   │   │   │   ├── trigger.executor.ts      # Action execution
│   │   │   │   ├── trigger.routes.ts
│   │   │   │   ├── trigger.types.ts
│   │   │   │   ├── trigger.validation.ts
│   │   │   │   ├── events/
│   │   │   │   │   ├── event.bus.ts        # Redis event bus
│   │   │   │   │   ├── event.publisher.ts
│   │   │   │   │   ├── event.consumer.ts
│   │   │   │   │   └── event.types.ts
│   │   │   │   └── actions/
│   │   │   │       ├── email.action.ts
│   │   │   │       ├── flow.action.ts
│   │   │   │       ├── database.action.ts
│   │   │   │       ├── webhook.action.ts
│   │   │   │       └── index.ts
│   │   │   │
│   │   │   ├── database/
│   │   │   │   ├── database.controller.ts
│   │   │   │   ├── database.service.ts
│   │   │   │   ├── schema.service.ts        # Schema management
│   │   │   │   ├── query.service.ts         # Data queries
│   │   │   │   ├── database.routes.ts
│   │   │   │   ├── database.types.ts
│   │   │   │   └── database.validation.ts
│   │   │   │
│   │   │   ├── datasets/
│   │   │   │   ├── dataset.controller.ts
│   │   │   │   ├── dataset.service.ts
│   │   │   │   ├── dataset.routes.ts
│   │   │   │   ├── dataset.types.ts
│   │   │   │   └── dataset.validation.ts
│   │   │   │
│   │   │   ├── company/
│   │   │   │   ├── company.controller.ts
│   │   │   │   ├── company.service.ts
│   │   │   │   ├── hierarchy.service.ts
│   │   │   │   ├── company.routes.ts
│   │   │   │   ├── company.types.ts
│   │   │   │   └── company.validation.ts
│   │   │   │
│   │   │   ├── integrations/
│   │   │   │   ├── integration.controller.ts
│   │   │   │   ├── integration.service.ts
│   │   │   │   ├── integration.routes.ts
│   │   │   │   ├── connectors/
│   │   │   │   │   ├── gmail.connector.ts
│   │   │   │   │   ├── sheets.connector.ts
│   │   │   │   │   ├── outlook.connector.ts
│   │   │   │   │   └── webhook.connector.ts
│   │   │   │   └── integration.types.ts
│   │   │   │
│   │   │   ├── users/
│   │   │   │   ├── user.controller.ts
│   │   │   │   ├── user.service.ts
│   │   │   │   ├── user.routes.ts
│   │   │   │   ├── user.types.ts
│   │   │   │   └── user.validation.ts
│   │   │   │
│   │   │   └── audit/
│   │   │       ├── audit.controller.ts
│   │   │       ├── audit.service.ts
│   │   │       ├── audit.middleware.ts
│   │   │       ├── audit.routes.ts
│   │   │       └── audit.types.ts
│   │   │
│   │   ├── common/
│   │   │   ├── config/
│   │   │   │   ├── database.config.ts
│   │   │   │   ├── redis.config.ts
│   │   │   │   ├── email.config.ts
│   │   │   │   └── app.config.ts
│   │   │   │
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   ├── error.middleware.ts
│   │   │   │   ├── logger.middleware.ts
│   │   │   │   ├── validation.middleware.ts
│   │   │   │   └── rate-limit.middleware.ts
│   │   │   │
│   │   │   ├── utils/
│   │   │   │   ├── logger.ts
│   │   │   │   ├── response.ts
│   │   │   │   ├── encryption.ts
│   │   │   │   ├── pagination.ts
│   │   │   │   └── date.ts
│   │   │   │
│   │   │   ├── errors/
│   │   │   │   ├── AppError.ts
│   │   │   │   ├── ValidationError.ts
│   │   │   │   ├── AuthError.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── types/
│   │   │       ├── express.d.ts
│   │   │       ├── common.types.ts
│   │   │       └── api.types.ts
│   │   │
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   │
│   │   ├── app.ts                           # Express app setup
│   │   └── server.ts                        # Server entry point
│   │
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   │
│   ├── .env.example
│   ├── .eslintrc.js
│   ├── .prettierrc
│   ├── tsconfig.json
│   ├── package.json
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── components/
│   │   │   │   │   ├── LoginForm.tsx
│   │   │   │   │   └── ProtectedRoute.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useAuth.ts
│   │   │   │   ├── store/
│   │   │   │   │   └── authStore.ts
│   │   │   │   └── types/
│   │   │   │       └── auth.types.ts
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── components/
│   │   │   │   │   ├── Dashboard.tsx
│   │   │   │   │   ├── StatsCard.tsx
│   │   │   │   │   ├── ActivityFeed.tsx
│   │   │   │   │   └── QuickStats.tsx
│   │   │   │   └── hooks/
│   │   │   │       └── useDashboard.ts
│   │   │   │
│   │   │   ├── task-builder/
│   │   │   │   ├── components/
│   │   │   │   │   ├── TaskBuilder.tsx
│   │   │   │   │   ├── FieldPalette.tsx
│   │   │   │   │   ├── FormCanvas.tsx
│   │   │   │   │   ├── FieldPropertiesPanel.tsx
│   │   │   │   │   ├── TaskList.tsx
│   │   │   │   │   ├── TaskPreview.tsx
│   │   │   │   │   └── field-types/
│   │   │   │   │       ├── TextField.tsx
│   │   │   │   │       ├── NumberField.tsx
│   │   │   │   │       ├── DateField.tsx
│   │   │   │   │       ├── DropdownField.tsx
│   │   │   │   │       ├── FileUploadField.tsx
│   │   │   │   │       └── index.ts
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useTaskBuilder.ts
│   │   │   │   │   └── useFieldValidation.ts
│   │   │   │   ├── store/
│   │   │   │   │   └── taskBuilderStore.ts
│   │   │   │   └── types/
│   │   │   │       └── task.types.ts
│   │   │   │
│   │   │   ├── flow-builder/
│   │   │   │   ├── components/
│   │   │   │   │   ├── FlowBuilder.tsx
│   │   │   │   │   ├── FlowCanvas.tsx
│   │   │   │   │   ├── FlowLevel.tsx
│   │   │   │   │   ├── FlowList.tsx
│   │   │   │   │   ├── BranchingRules.tsx
│   │   │   │   │   ├── TriggerSection.tsx
│   │   │   │   │   ├── TriggerCard.tsx
│   │   │   │   │   └── FlowSimulator.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useFlowBuilder.ts
│   │   │   │   ├── store/
│   │   │   │   │   └── flowBuilderStore.ts
│   │   │   │   └── types/
│   │   │   │       └── flow.types.ts
│   │   │   │
│   │   │   ├── trigger-builder/
│   │   │   │   ├── components/
│   │   │   │   │   ├── TriggerModal.tsx
│   │   │   │   │   ├── EventSelector.tsx
│   │   │   │   │   ├── ConditionBuilder.tsx
│   │   │   │   │   ├── ConditionGroup.tsx
│   │   │   │   │   ├── Condition.tsx
│   │   │   │   │   ├── ActionBuilder.tsx
│   │   │   │   │   ├── ActionList.tsx
│   │   │   │   │   ├── TriggerTester.tsx
│   │   │   │   │   └── actions/
│   │   │   │   │       ├── EmailAction.tsx
│   │   │   │   │       ├── FlowAction.tsx
│   │   │   │   │       ├── DatabaseAction.tsx
│   │   │   │   │       ├── WebhookAction.tsx
│   │   │   │   │       └── index.ts
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useTriggerBuilder.ts
│   │   │   │   │   └── useConditionBuilder.ts
│   │   │   │   └── types/
│   │   │   │       └── trigger.types.ts
│   │   │   │
│   │   │   ├── database-builder/
│   │   │   │   ├── components/
│   │   │   │   │   ├── DatabaseBuilder.tsx
│   │   │   │   │   ├── TableList.tsx
│   │   │   │   │   ├── SchemaDesigner.tsx
│   │   │   │   │   ├── RelationshipView.tsx
│   │   │   │   │   ├── DataPreview.tsx
│   │   │   │   │   └── FieldEditor.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useDatabaseBuilder.ts
│   │   │   │   └── types/
│   │   │   │       └── database.types.ts
│   │   │   │
│   │   │   ├── dataset-builder/
│   │   │   │   ├── components/
│   │   │   │   │   ├── DatasetBuilder.tsx
│   │   │   │   │   ├── DatasetList.tsx
│   │   │   │   │   ├── SectionEditor.tsx
│   │   │   │   │   └── DataVisualization.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useDatasetBuilder.ts
│   │   │   │   └── types/
│   │   │   │       └── dataset.types.ts
│   │   │   │
│   │   │   ├── company-hierarchy/
│   │   │   │   ├── components/
│   │   │   │   │   ├── CompanyHierarchy.tsx
│   │   │   │   │   ├── TreeView.tsx
│   │   │   │   │   ├── RoleDetails.tsx
│   │   │   │   │   └── EmployeeManager.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useCompanyHierarchy.ts
│   │   │   │   └── types/
│   │   │   │       └── company.types.ts
│   │   │   │
│   │   │   ├── integrations/
│   │   │   │   ├── components/
│   │   │   │   │   ├── Integrations.tsx
│   │   │   │   │   ├── ConnectorCard.tsx
│   │   │   │   │   ├── ActiveIntegrations.tsx
│   │   │   │   │   └── IntegrationConfig.tsx
│   │   │   │   └── hooks/
│   │   │   │       └── useIntegrations.ts
│   │   │   │
│   │   │   ├── audit-logs/
│   │   │   │   ├── components/
│   │   │   │   │   ├── AuditLogs.tsx
│   │   │   │   │   ├── LogTable.tsx
│   │   │   │   │   └── LogFilters.tsx
│   │   │   │   └── hooks/
│   │   │   │       └── useAuditLogs.ts
│   │   │   │
│   │   │   └── client-portal/
│   │   │       ├── components/
│   │   │       │   ├── ClientDashboard.tsx
│   │   │       │   ├── TaskQueue.tsx
│   │   │       │   ├── TaskCompletion.tsx
│   │   │       │   └── FlowTracking.tsx
│   │   │       └── hooks/
│   │   │           └── useClientPortal.ts
│   │   │
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Layout.tsx
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   └── Footer.tsx
│   │   │   │   ├── ui/
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Input.tsx
│   │   │   │   │   ├── Select.tsx
│   │   │   │   │   ├── Modal.tsx
│   │   │   │   │   ├── Card.tsx
│   │   │   │   │   ├── Table.tsx
│   │   │   │   │   ├── Badge.tsx
│   │   │   │   │   └── ... (shadcn/ui components)
│   │   │   │   ├── form/
│   │   │   │   │   ├── FormField.tsx
│   │   │   │   │   ├── FormError.tsx
│   │   │   │   │   └── FormLabel.tsx
│   │   │   │   └── common/
│   │   │   │       ├── Loading.tsx
│   │   │   │       ├── EmptyState.tsx
│   │   │   │       ├── ErrorBoundary.tsx
│   │   │   │       └── ConfirmDialog.tsx
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useApi.ts
│   │   │   │   ├── useDebounce.ts
│   │   │   │   ├── useLocalStorage.ts
│   │   │   │   └── usePagination.ts
│   │   │   │
│   │   │   └── utils/
│   │   │       ├── api.ts
│   │   │       ├── constants.ts
│   │   │       ├── validators.ts
│   │   │       └── helpers.ts
│   │   │
│   │   ├── services/
│   │   │   ├── api.service.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── task.service.ts
│   │   │   ├── flow.service.ts
│   │   │   ├── trigger.service.ts
│   │   │   └── ... (other services)
│   │   │
│   │   ├── types/
│   │   │   ├── global.types.ts
│   │   │   ├── api.types.ts
│   │   │   └── models.types.ts
│   │   │
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── routes.tsx
│   │
│   ├── public/
│   ├── tests/
│   ├── .env.example
│   ├── .eslintrc.js
│   ├── .prettierrc
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── package.json
│   └── README.md
│
├── .cursorrules                             # Cursor AI rules
├── .gitignore
├── .husky/                                  # Git hooks
├── docker-compose.yml                       # Development environment
└── README.md
```

---

## 4. Data Flow Patterns

### 4.1 Authentication Flow
```
User Login Request
    ↓
Frontend sends credentials
    ↓
Backend validates → Generate JWT
    ↓
Store token in localStorage
    ↓
Include token in all API requests (Authorization: Bearer <token>)
    ↓
Middleware validates token on each request
```

### 4.2 Task Execution Flow
```
User completes task
    ↓
Frontend: POST /api/tasks/{id}/complete with data
    ↓
Backend: Task Service validates and saves data
    ↓
Backend: Publish event to Redis (task_completed)
    ↓
Trigger Engine: Consume event
    ↓
Trigger Engine: Evaluate all relevant triggers
    ↓
Trigger Engine: Execute actions (email, start flow, etc.)
    ↓
Flow Engine: Move to next level if in flow
    ↓
Response sent to frontend
```

### 4.3 Trigger Evaluation Flow
```
Event occurs (task completed, field changed, etc.)
    ↓
Event Bus: Publish event to Redis Stream
    ↓
Trigger Service: Consumer picks up event
    ↓
Trigger Service: Find all triggers for this event type
    ↓
Trigger Evaluator: For each trigger
    ├─ Evaluate conditions
    ├─ If conditions met → Queue actions
    └─ Log execution
    ↓
Action Executor: Process queued actions
    ├─ Send Email
    ├─ Start Flow
    ├─ Update Database
    └─ Call Webhook
    ↓
Log results and update trigger statistics
```

---

## 5. Security Architecture

### 5.1 Authentication & Authorization
```
- JWT-based authentication
- Token expiry: 24 hours
- Refresh token: 7 days
- Password hashing: bcrypt (10 rounds)
- Role-based access control (RBAC)
- Roles: Developer, Admin, Employee
```

### 5.2 API Security
```
- HTTPS only (enforce in production)
- CORS configured for specific origins
- Rate limiting: 100 requests/15 minutes per IP
- Request size limit: 10MB
- Input validation on all endpoints (Zod)
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention (sanitize inputs)
```

### 5.3 Data Security
```
- Passwords: bcrypt hashed
- Sensitive data: encrypted at rest (AES-256)
- Database: connection string in environment variables
- API keys: stored as environment variables
- File uploads: validate file types and size
- No sensitive data in logs
```

---

## 6. Performance Considerations

### 6.1 Frontend Optimization
```
- Code splitting (React.lazy)
- Image optimization
- Lazy loading for long lists
- Debounce search inputs (300ms)
- Memoization (React.memo, useMemo, useCallback)
- Virtual scrolling for large datasets
```

### 6.2 Backend Optimization
```
- Database indexing on frequently queried fields
- Connection pooling (Prisma default)
- Pagination (default: 20 items per page)
- Caching with Redis:
  - User sessions: 24 hours
  - Static data: 5 minutes
  - Query results: 1 minute
- Async processing for heavy operations
- Background jobs for trigger execution
```

### 6.3 Database Optimization
```
- Proper indexing strategy
- Avoid N+1 queries (Prisma includes)
- Use database transactions for multi-step operations
- Soft deletes instead of hard deletes
- Archive old data regularly
```

---

## 7. Error Handling Strategy

### 7.1 Error Types
```typescript
// Custom error classes
- AppError: Base error class
- ValidationError: Input validation failures
- AuthError: Authentication/authorization failures
- NotFoundError: Resource not found
- ConflictError: Duplicate entries
- DatabaseError: Database operation failures
```

### 7.2 Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "meta": {
    "timestamp": "2024-01-20T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

---

## 8. Logging Strategy

### 8.1 Log Levels
```
- ERROR: Application errors, failed operations
- WARN: Warnings, deprecated usage
- INFO: Important business events
- DEBUG: Detailed debug information (dev only)
```

### 8.2 Log Format
```json
{
  "timestamp": "2024-01-20T10:30:00Z",
  "level": "INFO",
  "requestId": "req_abc123",
  "userId": "user_123",
  "message": "User logged in",
  "context": {
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  }
}
```

### 8.3 What to Log
```
✅ User authentication events
✅ Task creation/completion
✅ Flow execution steps
✅ Trigger evaluations and executions
✅ API errors and exceptions
✅ Database errors
✅ Integration failures

❌ Passwords
❌ API keys/tokens
❌ Personal sensitive data
```

---

## 9. Deployment Architecture (Phase 1)

### 9.1 Development Environment
```
- Docker Compose for local development
- PostgreSQL container
- Redis container
- Backend on localhost:3000
- Frontend on localhost:5173
- Hot reload enabled
```

### 9.2 Production Environment (Simple)
```
- Single server deployment (Phase 1)
- PostgreSQL on same server or managed service
- Redis on same server or managed service
- PM2 for process management
- Nginx as reverse proxy
- SSL/TLS certificates (Let's Encrypt)
```

### 9.3 CI/CD Pipeline (Basic)
```
1. Code pushed to GitHub
2. GitHub Actions triggered
3. Run linting and tests
4. Build frontend and backend
5. Deploy to server (SSH)
6. Restart services
```

---

## 10. Scalability Roadmap (Phase 2+)

### Phase 2 Enhancements
```
- Multi-tenancy implementation
- Microservices architecture
- Kubernetes orchestration
- Load balancing
- Database read replicas
- Distributed caching
- Message queue (RabbitMQ/Kafka)
- CDN for static assets
```

### Phase 3 Enhancements
```
- White-labeling system
- Standalone export functionality
- Auto-scaling
- Global CDN
- Multi-region deployment
- Advanced analytics
- Machine learning for predictions
```

---

## 11. Monitoring & Observability

### 11.1 Application Monitoring
```
- Health check endpoint: GET /health
- Metrics: Request count, response time, error rate
- Alert on: High error rate, slow response time, service down
```

### 11.2 Database Monitoring
```
- Connection pool utilization
- Query performance
- Slow query log
- Database size
```

### 11.3 Business Metrics
```
- Active users (daily/monthly)
- Tasks completed
- Flows executed
- Trigger success rate
- Average task completion time
```

---

## 12. Backup & Disaster Recovery

### 12.1 Backup Strategy
```
- Database backups: Daily (7 days retention)
- File storage backups: Daily (30 days retention)
- Application code: Git repository
- Configuration: Environment variables documented
```

### 12.2 Recovery Plan
```
1. Restore database from latest backup
2. Restore file storage
3. Deploy latest stable version
4. Verify data integrity
5. Resume operations
```

---

## 13. Development Workflow

### 13.1 Git Workflow
```
main (production-ready)
  ↓
develop (integration branch)
  ↓
feature/* (new features)
bugfix/* (bug fixes)
hotfix/* (urgent production fixes)
```

### 13.2 Code Review Process
```
1. Create feature branch
2. Implement feature
3. Write tests
4. Create pull request
5. Code review
6. Merge to develop
7. Deploy to staging
8. Test on staging
9. Merge to main
10. Deploy to production
```

---

## 14. Technical Debt Management

### 14.1 Known Limitations (Phase 1)
```
- Single-tenant only (multi-tenancy in Phase 2)
- No real-time collaboration
- Limited offline support
- Basic email templates
- Simple file storage (local filesystem)
```

### 14.2 Planned Improvements
```
- Implement WebSocket for real-time updates
- Add offline mode with service workers
- Migrate to S3 for file storage
- Add advanced email editor
- Implement caching layer
- Add search indexing (Elasticsearch)
```

---

## 15. API Rate Limiting

### 15.1 Rate Limits
```
General endpoints: 100 requests / 15 minutes
Authentication: 5 requests / 15 minutes
File upload: 10 requests / 15 minutes
Trigger testing: 20 requests / 15 minutes
```

### 15.2 Rate Limit Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "retryAfter": 900
  }
}
```

---

## 16. Environment Configuration

### 16.1 Environment Variables
```bash
# Backend (.env)
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/erpbuilder
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password
FILE_UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

```bash
# Frontend (.env)
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=ERP Builder
VITE_APP_VERSION=1.0.0
```

---

## 17. Testing Strategy

### 17.1 Testing Pyramid
```
        /\
       /  \      E2E Tests (10%)
      /____\
     /      \    Integration Tests (30%)
    /________\
   /          \  Unit Tests (60%)
  /____________\
```

### 17.2 Test Coverage Goals
```
- Unit tests: 80% coverage
- Integration tests: Key user journeys
- E2E tests: Critical flows (login, task creation, flow execution)
```

---

## 18. Documentation Standards

### 18.1 Code Documentation
```
- JSDoc for all public functions
- README.md in each major module
- API documentation (OpenAPI/Swagger)
- Architecture Decision Records (ADRs)
```

### 18.2 User Documentation
```
- Developer Console User Guide
- Client Portal User Guide
- API Documentation
- Integration Guides
- Troubleshooting Guide
```

---

## Summary

This architecture is designed for:
- ✅ Rapid development with Cursor AI
- ✅ Clear separation of concerns
- ✅ Easy to understand and maintain
- ✅ Scalable to Phase 2 and beyond
- ✅ Production-ready security
- ✅ Comprehensive error handling
- ✅ Thorough logging and monitoring

**Next Steps:**
1. Review this architecture
2. Set up development environment
3. Initialize project structure
4. Begin development with Cursor prompts
