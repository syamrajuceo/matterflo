# Database Schema Document
# ERP Builder - Complete Prisma Schema

**Version:** 1.0  
**Date:** November 2025  
**Database:** PostgreSQL 16.x  
**ORM:** Prisma 5.x

---

## 1. Complete Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// 1. USER MANAGEMENT
// ============================================

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  firstName String?
  lastName  String?
  role      UserRole @default(EMPLOYEE)
  isActive  Boolean  @default(true)
  avatar    String?
  
  // Relations
  companyId String?
  company   Company? @relation(fields: [companyId], references: [id])
  
  // Activity tracking
  createdTasks    Task[]          @relation("TaskCreator")
  completedTasks  TaskExecution[] @relation("TaskExecutor")
  createdFlows    Flow[]          @relation("FlowCreator")
  initiatedFlows  FlowInstance[]  @relation("FlowInitiator")
  auditLogs       AuditLog[]
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  lastLogin DateTime?
  
  @@index([email])
  @@index([companyId])
  @@map("users")
}

enum UserRole {
  DEVELOPER
  ADMIN
  MANAGER
  EMPLOYEE
}

// ============================================
// 2. COMPANY & HIERARCHY
// ============================================

model Company {
  id          String  @id @default(uuid())
  name        String
  domain      String? @unique
  logo        String?
  isActive    Boolean @default(true)
  
  // Customization
  primaryColor   String @default("#3B82F6")
  secondaryColor String @default("#1A1F2E")
  
  // Relations
  users        User[]
  departments  Department[]
  roles        Role[]
  tasks        Task[]
  flows        Flow[]
  datasets     Dataset[]
  tables       CustomTable[]
  integrations Integration[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("companies")
}

model Department {
  id          String  @id @default(uuid())
  name        String
  description String?
  parentId    String?
  
  // Relations
  companyId String
  company   Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  parent    Department?  @relation("DepartmentHierarchy", fields: [parentId], references: [id])
  children  Department[] @relation("DepartmentHierarchy")
  roles     Role[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([companyId])
  @@index([parentId])
  @@map("departments")
}

model Role {
  id          String  @id @default(uuid())
  name        String
  description String?
  permissions Json    @default("{}")
  
  // Relations
  companyId    String
  company      Company     @relation(fields: [companyId], references: [id], onDelete: Cascade)
  departmentId String?
  department   Department? @relation(fields: [departmentId], references: [id])
  
  flowLevels FlowLevel[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([companyId, name])
  @@index([companyId])
  @@map("roles")
}

// ============================================
// 3. TASKS
// ============================================

model Task {
  id          String      @id @default(uuid())
  name        String
  description String?
  version     String      @default("1.0")
  status      TaskStatus  @default(DRAFT)
  
  // Task Definition (JSON structure)
  fields      Json        // Array of field definitions
  validations Json        @default("[]")
  logic       Json        @default("{}") // Conditional logic
  
  // Metadata
  companyId String
  company   Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  createdById String
  createdBy   User   @relation("TaskCreator", fields: [createdById], references: [id])
  
  // Relations
  flowLevelTasks FlowLevelTask[]
  executions     TaskExecution[]
  triggers       Trigger[]
  
  // Timestamps
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  publishedAt DateTime?
  
  @@index([companyId])
  @@index([status])
  @@map("tasks")
}

enum TaskStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
  DEPRECATED
}

model TaskExecution {
  id       String @id @default(uuid())
  
  // Task reference
  taskId   String
  task     Task   @relation(fields: [taskId], references: [id])
  
  // Data submitted
  data     Json   // Task field values
  
  // Execution context
  executorId String
  executor   User   @relation("TaskExecutor", fields: [executorId], references: [id])
  
  // Flow context (if task is part of flow)
  flowInstanceId String?
  flowInstance   FlowInstance? @relation(fields: [flowInstanceId], references: [id])
  levelId        String?
  
  // Status
  status        ExecutionStatus @default(COMPLETED)
  completedAt   DateTime        @default(now())
  
  createdAt DateTime @default(now())
  
  @@index([taskId])
  @@index([executorId])
  @@index([flowInstanceId])
  @@map("task_executions")
}

enum ExecutionStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
}

// ============================================
// 4. FLOWS
// ============================================

model Flow {
  id          String     @id @default(uuid())
  name        String
  description String?
  version     String     @default("1.0")
  status      FlowStatus @default(DRAFT)
  
  // Flow configuration
  config      Json       @default("{}")
  
  // Relations
  companyId   String
  company     Company    @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  createdById String
  createdBy   User       @relation("FlowCreator", fields: [createdById], references: [id])
  
  levels      FlowLevel[]
  branches    FlowBranch[]
  instances   FlowInstance[]
  triggers    Trigger[]
  
  // Timestamps
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  publishedAt DateTime?
  
  @@index([companyId])
  @@index([status])
  @@map("flows")
}

enum FlowStatus {
  DRAFT
  PUBLISHED
  ACTIVE
  ARCHIVED
}

model FlowLevel {
  id          String  @id @default(uuid())
  name        String
  description String?
  order       Int     // Sequential order
  
  // Relations
  flowId      String
  flow        Flow    @relation(fields: [flowId], references: [id], onDelete: Cascade)
  
  // Level configuration
  config      Json    @default("{}")
  
  // Task assignments
  tasks       FlowLevelTask[]
  roles       Role[]
  
  // Branching (outgoing branches from this level)
  outgoingBranches FlowBranch[] @relation("BranchFrom")
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([flowId, order])
  @@index([flowId])
  @@map("flow_levels")
}

model FlowLevelTask {
  id      String @id @default(uuid())
  
  levelId String
  level   FlowLevel @relation(fields: [levelId], references: [id], onDelete: Cascade)
  
  taskId  String
  task    Task   @relation(fields: [taskId], references: [id])
  
  order   Int
  config  Json   @default("{}")
  
  createdAt DateTime @default(now())
  
  @@unique([levelId, order])
  @@index([levelId])
  @@index([taskId])
  @@map("flow_level_tasks")
}

model FlowBranch {
  id          String @id @default(uuid())
  name        String
  
  // Branch routing
  fromLevelId String
  fromLevel   FlowLevel @relation("BranchFrom", fields: [fromLevelId], references: [id], onDelete: Cascade)
  
  toLevelId   String
  
  // Conditions (JSON structure)
  conditions  Json
  
  // Priority (lower number = higher priority)
  priority    Int    @default(0)
  
  // Relations
  flowId      String
  flow        Flow   @relation(fields: [flowId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([flowId])
  @@index([fromLevelId])
  @@map("flow_branches")
}

// Flow execution instances
model FlowInstance {
  id          String             @id @default(uuid())
  
  // Flow reference
  flowId      String
  flow        Flow               @relation(fields: [flowId], references: [id])
  
  // Current state
  currentLevelOrder Int          @default(1)
  status      FlowInstanceStatus @default(IN_PROGRESS)
  
  // Context data
  contextData Json               @default("{}")
  
  // Initiator
  initiatorId String
  initiator   User               @relation("FlowInitiator", fields: [initiatorId], references: [id])
  
  // Relations
  taskExecutions TaskExecution[]
  
  // Timestamps
  startedAt   DateTime           @default(now())
  completedAt DateTime?
  
  @@index([flowId])
  @@index([status])
  @@map("flow_instances")
}

enum FlowInstanceStatus {
  IN_PROGRESS
  COMPLETED
  FAILED
  CANCELLED
}

// ============================================
// 5. TRIGGERS & AUTOMATION
// ============================================

model Trigger {
  id          String        @id @default(uuid())
  name        String
  description String?
  isActive    Boolean       @default(true)
  
  // Event configuration
  eventType   EventType
  eventConfig Json          @default("{}")
  
  // Conditions (JSON structure)
  conditions  Json?
  
  // Actions (JSON array)
  actions     Json          // Array of action configurations
  
  // Advanced settings
  settings    Json          @default("{}")
  
  // Context (attached to task or flow)
  taskId      String?
  task        Task?         @relation(fields: [taskId], references: [id], onDelete: Cascade)
  
  flowId      String?
  flow        Flow?         @relation(fields: [flowId], references: [id], onDelete: Cascade)
  
  // Execution logs
  executions  TriggerExecution[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([eventType])
  @@index([taskId])
  @@index([flowId])
  @@map("triggers")
}

enum EventType {
  TASK_COMPLETED
  TASK_STARTED
  TASK_UPDATED
  FIELD_CHANGED
  FLOW_STARTED
  FLOW_COMPLETED
  DATABASE_ROW_CREATED
  DATABASE_ROW_UPDATED
  SCHEDULED
  WEBHOOK_RECEIVED
}

model TriggerExecution {
  id              String   @id @default(uuid())
  
  triggerId       String
  trigger         Trigger  @relation(fields: [triggerId], references: [id], onDelete: Cascade)
  
  // Event data
  eventData       Json
  
  // Evaluation results
  conditionsMet   Boolean
  conditionResult Json     // Detailed evaluation
  
  // Actions executed
  actionsExecuted Json
  
  // Status
  status          TriggerExecutionStatus @default(SUCCESS)
  errorMessage    String?
  
  // Performance
  executionTime   Int      // milliseconds
  
  executedAt DateTime @default(now())
  
  @@index([triggerId])
  @@index([status])
  @@index([executedAt])
  @@map("trigger_executions")
}

enum TriggerExecutionStatus {
  SUCCESS
  PARTIAL_SUCCESS
  FAILED
}

// ============================================
// 6. DATASETS
// ============================================

model Dataset {
  id          String        @id @default(uuid())
  name        String
  description String?
  category    String?
  
  // Sections (JSON array)
  sections    Json
  
  // Access control
  visibility  Json          @default("{}")
  
  // Relations
  companyId   String
  company     Company       @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  status      DatasetStatus @default(DRAFT)
  
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  publishedAt DateTime?
  
  @@index([companyId])
  @@map("datasets")
}

enum DatasetStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

// ============================================
// 7. CUSTOM DATABASE (Dynamic Tables)
// ============================================

model CustomTable {
  id          String  @id @default(uuid())
  name        String
  displayName String
  description String?
  
  // Schema definition (JSON)
  schema      Json    // Field definitions, types, validations
  
  // Relations definition (JSON)
  relations   Json    @default("[]")
  
  // Settings
  settings    Json    @default("{}")
  
  // Relations
  companyId   String
  company     Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  records     CustomTableRecord[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([companyId, name])
  @@index([companyId])
  @@map("custom_tables")
}

model CustomTableRecord {
  id      String      @id @default(uuid())
  
  tableId String
  table   CustomTable @relation(fields: [tableId], references: [id], onDelete: Cascade)
  
  // Actual data (JSON)
  data    Json
  
  // Metadata
  createdBy String?
  updatedBy String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime? // Soft delete
  
  @@index([tableId])
  @@index([deletedAt])
  @@map("custom_table_records")
}

// ============================================
// 8. INTEGRATIONS
// ============================================

model Integration {
  id          String            @id @default(uuid())
  name        String
  type        IntegrationType
  isActive    Boolean           @default(true)
  
  // Configuration (API keys, etc.)
  config      Json
  
  // Relations
  companyId   String
  company     Company           @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  // Activity
  workflows   IntegrationWorkflow[]
  
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  lastSyncAt  DateTime?
  
  @@index([companyId])
  @@index([type])
  @@map("integrations")
}

enum IntegrationType {
  GMAIL
  GOOGLE_SHEETS
  OUTLOOK
  TALLY
  ZOHO
  WEBHOOK
  CUSTOM_API
}

model IntegrationWorkflow {
  id            String      @id @default(uuid())
  name          String
  
  integrationId String
  integration   Integration @relation(fields: [integrationId], references: [id], onDelete: Cascade)
  
  // Trigger and action configuration
  triggerConfig Json
  actionConfig  Json
  
  isActive      Boolean     @default(true)
  
  // Execution stats
  executionCount Int        @default(0)
  lastExecutedAt DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([integrationId])
  @@map("integration_workflows")
}

// ============================================
// 9. AUDIT LOGS
// ============================================

model AuditLog {
  id          String   @id @default(uuid())
  
  // Who did it
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  // What was done
  action      String   // e.g., "task.created", "flow.updated"
  entity      String   // e.g., "Task", "Flow"
  entityId    String
  
  // Details
  changes     Json?    // Before/after for updates
  metadata    Json     @default("{}")
  
  // Context
  ipAddress   String?
  userAgent   String?
  
  // Severity
  level       LogLevel @default(INFO)
  
  timestamp   DateTime @default(now())
  
  @@index([userId])
  @@index([action])
  @@index([entity, entityId])
  @@index([timestamp])
  @@map("audit_logs")
}

enum LogLevel {
  INFO
  WARNING
  ERROR
  CRITICAL
}

// ============================================
// 10. VERSIONS & RELEASES
// ============================================

model Version {
  id          String        @id @default(uuid())
  version     String        // e.g., "3.1.0"
  
  // What changed
  entityType  String        // "Task", "Flow", etc.
  entityId    String
  
  // Version data snapshot
  snapshot    Json
  
  // Change information
  changes     String?
  changeLog   Json          @default("[]")
  
  // Status
  status      VersionStatus @default(DRAFT)
  
  // Deployment
  rolloutPercentage Int     @default(0)
  deployedToClients Json    @default("[]")
  
  // Metadata
  createdBy   String
  
  createdAt   DateTime      @default(now())
  publishedAt DateTime?
  
  @@index([entityType, entityId])
  @@index([version])
  @@map("versions")
}

enum VersionStatus {
  DRAFT
  PUBLISHED
  STABLE
  DEPRECATED
}

// ============================================
// 11. FILE UPLOADS
// ============================================

model File {
  id          String   @id @default(uuid())
  filename    String
  originalName String
  mimetype    String
  size        Int
  path        String
  
  // Context
  uploadedBy  String
  context     String?  // "task_attachment", "avatar", etc.
  contextId   String?  // Related entity ID
  
  uploadedAt  DateTime @default(now())
  
  @@index([context, contextId])
  @@map("files")
}

// ============================================
// 12. EMAIL TEMPLATES
// ============================================

model EmailTemplate {
  id          String   @id @default(uuid())
  name        String
  subject     String
  body        String   @db.Text
  
  // Variables used in template
  variables   Json     @default("[]")
  
  // Template type
  type        String   // "notification", "approval_request", etc.
  
  isActive    Boolean  @default(true)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("email_templates")
}
```

---

## 2. Database Indexes Strategy

### High-Priority Indexes (Performance Critical)
```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company ON users(company_id);

-- Task & Flow execution
CREATE INDEX idx_task_executions_task ON task_executions(task_id);
CREATE INDEX idx_task_executions_flow ON task_executions(flow_instance_id);
CREATE INDEX idx_flow_instances_status ON flow_instances(status);

-- Triggers
CREATE INDEX idx_triggers_event_type ON triggers(event_type);
CREATE INDEX idx_trigger_executions_timestamp ON trigger_executions(executed_at);

-- Audit logs (for reporting)
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);

-- Custom tables (dynamic data)
CREATE INDEX idx_custom_table_records_table ON custom_table_records(table_id);
CREATE INDEX idx_custom_table_records_soft_delete ON custom_table_records(deleted_at);
```

---

## 3. Sample Data for Development

### Seed Script Structure
```typescript
// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Create sample company
  const company = await prisma.company.create({
    data: {
      name: 'Acme Corporation',
      domain: 'acme.com',
      logo: '/logos/acme.png',
    },
  });

  // 2. Create sample users
  const developer = await prisma.user.create({
    data: {
      email: 'developer@erpbuilder.com',
      password: await bcrypt.hash('password123', 10),
      firstName: 'Alex',
      lastName: 'Developer',
      role: 'DEVELOPER',
      companyId: company.id,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@acme.com',
      password: await bcrypt.hash('password123', 10),
      firstName: 'Sarah',
      lastName: 'Admin',
      role: 'ADMIN',
      companyId: company.id,
    },
  });

  // 3. Create departments
  const engineering = await prisma.department.create({
    data: {
      name: 'Engineering',
      description: 'Engineering team',
      companyId: company.id,
    },
  });

  const finance = await prisma.department.create({
    data: {
      name: 'Finance',
      description: 'Finance team',
      companyId: company.id,
    },
  });

  // 4. Create roles
  const managerRole = await prisma.role.create({
    data: {
      name: 'Manager',
      description: 'Department manager',
      companyId: company.id,
      departmentId: engineering.id,
      permissions: {
        canApprove: true,
        canReject: true,
        canReassign: true,
      },
    },
  });

  // 5. Create sample task
  const expenseTask = await prisma.task.create({
    data: {
      name: 'Expense Approval Form',
      description: 'Submit expense for approval',
      status: 'PUBLISHED',
      companyId: company.id,
      createdById: developer.id,
      fields: [
        {
          id: 'field_1',
          type: 'text',
          label: 'Employee Name',
          required: true,
        },
        {
          id: 'field_2',
          type: 'number',
          label: 'Amount',
          required: true,
          validation: { min: 0 },
        },
        {
          id: 'field_3',
          type: 'dropdown',
          label: 'Category',
          required: true,
          options: ['Travel', 'Office Supplies', 'Equipment'],
        },
        {
          id: 'field_4',
          type: 'file',
          label: 'Receipt',
          required: true,
        },
      ],
    },
  });

  // 6. Create sample flow
  const expenseFlow = await prisma.flow.create({
    data: {
      name: 'Expense Approval Workflow',
      description: '3-level expense approval process',
      status: 'PUBLISHED',
      companyId: company.id,
      createdById: developer.id,
    },
  });

  // 7. Create flow levels
  const level1 = await prisma.flowLevel.create({
    data: {
      name: 'Employee Submission',
      order: 1,
      flowId: expenseFlow.id,
    },
  });

  const level2 = await prisma.flowLevel.create({
    data: {
      name: 'Manager Review',
      order: 2,
      flowId: expenseFlow.id,
    },
  });

  const level3 = await prisma.flowLevel.create({
    data: {
      name: 'Finance Approval',
      order: 3,
      flowId: expenseFlow.id,
    },
  });

  // 8. Create sample trigger
  await prisma.trigger.create({
    data: {
      name: 'High-Value Alert',
      description: 'Alert CFO for expenses > $10,000',
      eventType: 'TASK_COMPLETED',
      taskId: expenseTask.id,
      conditions: {
        operator: 'AND',
        rules: [
          {
            field: 'Amount',
            operator: 'greater_than',
            value: 10000,
          },
        ],
      },
      actions: [
        {
          type: 'send_email',
          config: {
            to: 'cfo@acme.com',
            subject: 'High-value expense requires review',
            template: 'high_value_expense',
          },
        },
      ],
    },
  });

  // 9. Create email templates
  await prisma.emailTemplate.create({
    data: {
      name: 'High Value Expense Alert',
      type: 'high_value_expense',
      subject: 'High-value expense requires your review',
      body: `
        Hello,
        
        A high-value expense request has been submitted:
        
        Employee: {{employee_name}}
        Amount: ${{amount}}
        Category: {{category}}
        
        Please review at: {{link_to_task}}
      `,
      variables: ['employee_name', 'amount', 'category', 'link_to_task'],
    },
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 4. Database Migration Strategy

### Initial Migration
```bash
# Create initial migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Seed database
npm run seed
```

### Ongoing Migrations
```bash
# Create new migration
npx prisma migrate dev --name add_feature_x

# Apply migrations in production
npx prisma migrate deploy
```

---

## 5. Data Types & JSON Structures

### Task Fields JSON Structure
```json
{
  "fields": [
    {
      "id": "field_1",
      "type": "text",
      "label": "Employee Name",
      "placeholder": "Enter your name",
      "required": true,
      "validation": {
        "minLength": 2,
        "maxLength": 100
      }
    },
    {
      "id": "field_2",
      "type": "number",
      "label": "Amount",
      "required": true,
      "validation": {
        "min": 0,
        "max": 100000
      }
    }
  ]
}
```

### Trigger Conditions JSON
```json
{
  "operator": "AND",
  "rules": [
    {
      "field": "Amount",
      "operator": "greater_than",
      "value": 10000
    },
    {
      "field": "Decision",
      "operator": "equals",
      "value": "Approved"
    }
  ]
}
```

### Trigger Actions JSON
```json
{
  "actions": [
    {
      "type": "send_email",
      "config": {
        "to": "cfo@company.com",
        "subject": "Approval required",
        "template": "approval_request",
        "variables": {
          "amount": "{{field_amount}}",
          "employee": "{{field_employee_name}}"
        }
      }
    },
    {
      "type": "start_flow",
      "config": {
        "flowId": "flow_uuid",
        "assignTo": "CEO",
        "passData": true
      }
    }
  ]
}
```

---

## 6. Query Examples

### Common Queries

```typescript
// Get all active flows for a company
const flows = await prisma.flow.findMany({
  where: {
    companyId: 'company_id',
    status: 'PUBLISHED',
  },
  include: {
    levels: {
      orderBy: { order: 'asc' },
      include: {
        tasks: {
          include: { task: true },
        },
      },
    },
  },
});

// Get user's pending tasks
const pendingTasks = await prisma.flowInstance.findMany({
  where: {
    status: 'IN_PROGRESS',
    flow: {
      levels: {
        some: {
          roles: {
            some: {
              name: userRole,
            },
          },
        },
      },
    },
  },
  include: {
    flow: {
      include: {
        levels: {
          orderBy: { order: 'asc' },
        },
      },
    },
  },
});

// Get trigger execution statistics
const stats = await prisma.triggerExecution.groupBy({
  by: ['status'],
  where: {
    triggerId: 'trigger_id',
    executedAt: {
      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    },
  },
  _count: true,
});

// Get audit logs with user info
const logs = await prisma.auditLog.findMany({
  where: {
    entity: 'Task',
    entityId: 'task_id',
  },
  include: {
    user: {
      select: {
        firstName: true,
        lastName: true,
        email: true,
      },
    },
  },
  orderBy: { timestamp: 'desc' },
  take: 50,
});
```

---

## 7. Backup & Maintenance

### Backup Strategy
```bash
# Daily backup
pg_dump -h localhost -U postgres erpbuilder > backup_$(date +%Y%m%d).sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups/postgresql"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
pg_dump -h localhost -U postgres erpbuilder | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

### Maintenance Tasks
```sql
-- Vacuum and analyze (run weekly)
VACUUM ANALYZE;

-- Reindex (run monthly)
REINDEX DATABASE erpbuilder;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 8. Performance Optimization

### Slow Query Analysis
```sql
-- Enable query logging (postgresql.conf)
log_min_duration_statement = 1000  # Log queries taking > 1 second

-- Find slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;
```

### Connection Pooling
```typescript
// Prisma connection pool configuration
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connection_limit = 10
}
```

---

## Summary

This database schema provides:
- ✅ Complete data model for Phase 1 MVP
- ✅ Flexible JSON fields for dynamic content
- ✅ Proper indexing for performance
- ✅ Audit trail for all operations
- ✅ Soft deletes for data safety
- ✅ Versioning support
- ✅ Multi-tenant ready (company isolation)
- ✅ Scalable to Phase 2 enhancements

**Next Steps:**
1. Initialize Prisma in project
2. Apply this schema
3. Run seed script
4. Begin building services
