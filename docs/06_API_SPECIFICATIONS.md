# API SPECIFICATIONS
# ERP Builder - Complete REST API Reference

**Version:** 1.0  
**Base URL:** `https://api.erpbuilder.com` (Production)  
**Base URL:** `http://localhost:3000` (Development)  
**API Prefix:** `/api`

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Tasks](#tasks)
3. [Flows](#flows)
4. [Triggers](#triggers)
5. [Database](#database)
6. [Datasets](#datasets)
7. [Company](#company)
8. [Integrations](#integrations)
9. [Audit Logs](#audit-logs)
10. [Users](#users)
11. [Versions](#versions)
12. [Export](#export)

---

## 🔐 Authentication

All API requests (except auth endpoints) require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Register

**POST** `/api/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "EMPLOYEE"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors:**
- 400: Invalid input
- 409: Email already exists

---

### Login

**POST** `/api/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "EMPLOYEE",
      "companyId": "company_123"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors:**
- 401: Invalid credentials

---

### Refresh Token

**POST** `/api/auth/refresh`

Get a new access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Get Current User

**GET** `/api/auth/me`

Get authenticated user's profile.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "EMPLOYEE",
    "companyId": "company_123",
    "isActive": true,
    "createdAt": "2024-01-20T10:00:00Z"
  }
}
```

---

## 📋 Tasks

### Create Task

**POST** `/api/tasks`

Create a new task.

**Request Body:**
```json
{
  "name": "Employee Onboarding Form",
  "description": "New employee information collection"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "task_123",
    "name": "Employee Onboarding Form",
    "description": "New employee information collection",
    "version": "1.0",
    "status": "DRAFT",
    "fields": [],
    "companyId": "company_123",
    "createdById": "user_123",
    "createdAt": "2024-01-20T10:00:00Z",
    "updatedAt": "2024-01-20T10:00:00Z"
  }
}
```

---

### List Tasks

**GET** `/api/tasks`

Get list of tasks with optional filters.

**Query Parameters:**
- `status` (optional): `DRAFT` | `PUBLISHED` | `ARCHIVED`
- `search` (optional): Search in name/description
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task_123",
        "name": "Employee Onboarding Form",
        "description": "New employee information",
        "version": "1.0",
        "status": "DRAFT",
        "fieldCount": 5,
        "createdAt": "2024-01-20T10:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "totalPages": 1
  }
}
```

---

### Get Task

**GET** `/api/tasks/:id`

Get task details including all fields.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "task_123",
    "name": "Employee Onboarding Form",
    "description": "New employee information",
    "version": "1.0",
    "status": "DRAFT",
    "fields": [
      {
        "id": "field_1",
        "type": "text",
        "label": "Full Name",
        "placeholder": "Enter full name",
        "required": true,
        "order": 0
      },
      {
        "id": "field_2",
        "type": "number",
        "label": "Employee ID",
        "required": true,
        "validation": {
          "min": 1000,
          "max": 9999
        },
        "order": 1
      }
    ],
    "createdAt": "2024-01-20T10:00:00Z",
    "updatedAt": "2024-01-20T10:30:00Z"
  }
}
```

**Errors:**
- 404: Task not found

---

### Update Task

**PUT** `/api/tasks/:id`

Update task details.

**Request Body:**
```json
{
  "name": "Updated Task Name",
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "task_123",
    "name": "Updated Task Name",
    "description": "Updated description",
    "version": "1.0",
    "status": "DRAFT",
    "fields": [...],
    "updatedAt": "2024-01-20T11:00:00Z"
  }
}
```

**Errors:**
- 400: Cannot update published task
- 404: Task not found

---

### Add Field to Task

**POST** `/api/tasks/:id/fields`

Add a new field to task.

**Request Body:**
```json
{
  "type": "text",
  "label": "Email Address",
  "placeholder": "Enter email",
  "required": true,
  "validation": {
    "pattern": "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "task_123",
    "fields": [
      {
        "id": "field_3",
        "type": "text",
        "label": "Email Address",
        "placeholder": "Enter email",
        "required": true,
        "validation": {
          "pattern": "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$"
        },
        "order": 2
      }
    ]
  }
}
```

---

### Update Field

**PUT** `/api/tasks/:id/fields/:fieldId`

Update an existing field.

**Request Body:**
```json
{
  "label": "Updated Label",
  "required": false
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "task_123",
    "fields": [...]
  }
}
```

---

### Delete Field

**DELETE** `/api/tasks/:id/fields/:fieldId`

Remove a field from task.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "task_123",
    "fields": [...]
  }
}
```

---

### Reorder Fields

**PUT** `/api/tasks/:id/fields/reorder`

Change field order.

**Request Body:**
```json
{
  "fieldIds": ["field_2", "field_1", "field_3"]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "task_123",
    "fields": [...]
  }
}
```

---

### Publish Task

**POST** `/api/tasks/:id/publish`

Publish task (makes it available for use in flows).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "task_123",
    "status": "PUBLISHED",
    "publishedAt": "2024-01-20T12:00:00Z"
  }
}
```

**Errors:**
- 400: Task must have at least one field

---

### Delete Task

**DELETE** `/api/tasks/:id`

Archive a task (soft delete).

**Response (200):**
```json
{
  "success": true,
  "data": null
}
```

---

### Duplicate Task

**POST** `/api/tasks/:id/duplicate`

Create a copy of existing task.

**Request Body:**
```json
{
  "name": "Copy of Employee Onboarding Form"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "task_456",
    "name": "Copy of Employee Onboarding Form",
    "status": "DRAFT",
    "fields": [...]
  }
}
```

---

## 🔄 Flows

### Create Flow

**POST** `/api/flows`

Create a new workflow.

**Request Body:**
```json
{
  "name": "Expense Approval Workflow",
  "description": "Multi-level expense approval process"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "flow_123",
    "name": "Expense Approval Workflow",
    "description": "Multi-level expense approval process",
    "version": "1.0",
    "status": "DRAFT",
    "levels": [],
    "createdAt": "2024-01-20T10:00:00Z"
  }
}
```

---

### List Flows

**GET** `/api/flows`

Get list of flows.

**Query Parameters:**
- `status` (optional): `DRAFT` | `PUBLISHED` | `ACTIVE` | `ARCHIVED`
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "success": true,
  "data": {
    "flows": [
      {
        "id": "flow_123",
        "name": "Expense Approval Workflow",
        "version": "1.0",
        "status": "PUBLISHED",
        "levelCount": 3,
        "createdAt": "2024-01-20T10:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "totalPages": 1
  }
}
```

---

### Get Flow

**GET** `/api/flows/:id`

Get flow details with all levels.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "flow_123",
    "name": "Expense Approval Workflow",
    "version": "1.0",
    "status": "PUBLISHED",
    "levels": [
      {
        "id": "level_1",
        "name": "Employee Submission",
        "order": 1,
        "tasks": [
          {
            "taskId": "task_123",
            "taskName": "Expense Form"
          }
        ],
        "roles": ["Employee"]
      },
      {
        "id": "level_2",
        "name": "Manager Review",
        "order": 2,
        "tasks": [
          {
            "taskId": "task_456",
            "taskName": "Approval Decision"
          }
        ],
        "roles": ["Manager"]
      }
    ],
    "branches": [
      {
        "id": "branch_1",
        "name": "High Value Path",
        "fromLevelId": "level_2",
        "toLevelId": "level_3",
        "conditions": {
          "operator": "AND",
          "rules": [
            {
              "field": "amount",
              "operator": "greater_than",
              "value": 10000
            }
          ]
        }
      }
    ]
  }
}
```

---

### Add Level to Flow

**POST** `/api/flows/:id/levels`

Add a new level to flow.

**Request Body:**
```json
{
  "name": "Manager Review",
  "order": 2
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "level_2",
    "name": "Manager Review",
    "order": 2,
    "flowId": "flow_123"
  }
}
```

---

### Add Task to Level

**POST** `/api/flows/:id/levels/:levelId/tasks`

Add a task to a flow level.

**Request Body:**
```json
{
  "taskId": "task_123",
  "order": 1
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "flow_level_task_1",
    "levelId": "level_2",
    "taskId": "task_123",
    "order": 1
  }
}
```

---

### Create Branch

**POST** `/api/flows/:id/branches`

Add branching logic to flow.

**Request Body:**
```json
{
  "name": "High Value Path",
  "fromLevelId": "level_2",
  "toLevelId": "level_3",
  "conditions": {
    "operator": "AND",
    "rules": [
      {
        "field": "amount",
        "operator": "greater_than",
        "value": 10000
      }
    ]
  },
  "priority": 1
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "branch_1",
    "name": "High Value Path",
    "fromLevelId": "level_2",
    "toLevelId": "level_3",
    "conditions": {...},
    "priority": 1
  }
}
```

---

### Start Flow Instance

**POST** `/api/flows/:id/start`

Start a new flow execution instance.

**Request Body:**
```json
{
  "contextData": {
    "initiatedBy": "user_123",
    "purpose": "Monthly expense"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "instance_123",
    "flowId": "flow_123",
    "status": "IN_PROGRESS",
    "currentLevelOrder": 1,
    "startedAt": "2024-01-20T13:00:00Z"
  }
}
```

---

### Get Flow Instance

**GET** `/api/flows/instances/:id`

Get flow instance details and progress.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "instance_123",
    "flowId": "flow_123",
    "flowName": "Expense Approval Workflow",
    "status": "IN_PROGRESS",
    "currentLevelOrder": 2,
    "progress": {
      "completedLevels": 1,
      "totalLevels": 3,
      "percentage": 33
    },
    "history": [
      {
        "level": 1,
        "levelName": "Employee Submission",
        "completedAt": "2024-01-20T13:30:00Z",
        "completedBy": "user_123"
      }
    ],
    "startedAt": "2024-01-20T13:00:00Z"
  }
}
```

---

## ⚡ Triggers

### Create Trigger

**POST** `/api/triggers`

Create automation trigger.

**Request Body:**
```json
{
  "name": "High Value Alert",
  "description": "Notify CFO for expenses > $10,000",
  "eventType": "TASK_COMPLETED",
  "taskId": "task_123",
  "conditions": {
    "operator": "AND",
    "rules": [
      {
        "field": "amount",
        "operator": "greater_than",
        "value": 10000
      }
    ]
  },
  "actions": [
    {
      "type": "send_email",
      "config": {
        "to": "cfo@company.com",
        "subject": "High-value expense alert",
        "template": "high_value_expense"
      }
    }
  ],
  "isActive": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "trigger_123",
    "name": "High Value Alert",
    "eventType": "TASK_COMPLETED",
    "isActive": true,
    "createdAt": "2024-01-20T14:00:00Z"
  }
}
```

---

### List Triggers

**GET** `/api/triggers`

Get list of triggers.

**Query Parameters:**
- `taskId` (optional): Filter by task
- `flowId` (optional): Filter by flow
- `eventType` (optional): Filter by event type
- `isActive` (optional): Filter by active status

**Response (200):**
```json
{
  "success": true,
  "data": {
    "triggers": [
      {
        "id": "trigger_123",
        "name": "High Value Alert",
        "eventType": "TASK_COMPLETED",
        "isActive": true,
        "executionCount": 47,
        "successRate": 98
      }
    ]
  }
}
```

---

### Test Trigger

**POST** `/api/triggers/:id/test`

Test trigger with sample data.

**Request Body:**
```json
{
  "eventData": {
    "amount": 15000,
    "category": "Travel",
    "employee": "John Doe"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "conditionsMet": true,
    "evaluation": {
      "rules": [
        {
          "field": "amount",
          "result": true,
          "expected": "> 10000",
          "actual": 15000
        }
      ]
    },
    "actionsToExecute": [
      {
        "type": "send_email",
        "to": "cfo@company.com",
        "status": "would_execute"
      }
    ],
    "note": "Test mode - no actions actually performed"
  }
}
```

---

### Get Trigger Executions

**GET** `/api/triggers/:id/executions`

Get trigger execution history.

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "success": true,
  "data": {
    "executions": [
      {
        "id": "execution_123",
        "triggerId": "trigger_123",
        "status": "SUCCESS",
        "conditionsMet": true,
        "actionsExecuted": 1,
        "executionTime": 850,
        "executedAt": "2024-01-20T15:00:00Z"
      }
    ],
    "total": 47,
    "page": 1,
    "totalPages": 3
  }
}
```

---

## 🗄️ Database (Custom Tables)

### Create Table

**POST** `/api/database/tables`

Create a custom table.

**Request Body:**
```json
{
  "name": "employees",
  "displayName": "Employees",
  "description": "Company employee records"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "table_123",
    "name": "employees",
    "displayName": "Employees",
    "schema": { "fields": [] },
    "recordCount": 0,
    "createdAt": "2024-01-20T10:00:00Z"
  }
}
```

---

### Add Field to Table

**POST** `/api/database/tables/:id/fields`

Add a field to custom table.

**Request Body:**
```json
{
  "name": "employee_name",
  "displayName": "Employee Name",
  "type": "text",
  "required": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "table_123",
    "schema": {
      "fields": [
        {
          "id": "field_1",
          "name": "employee_name",
          "displayName": "Employee Name",
          "type": "text",
          "required": true
        }
      ]
    }
  }
}
```

---

### Insert Record

**POST** `/api/database/tables/:id/records`

Insert a new record.

**Request Body:**
```json
{
  "employee_name": "John Doe",
  "email": "john@example.com",
  "department": "Engineering"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "record_123",
    "tableId": "table_123",
    "data": {
      "employee_name": "John Doe",
      "email": "john@example.com",
      "department": "Engineering"
    },
    "createdAt": "2024-01-20T11:00:00Z"
  }
}
```

---

### Query Records

**GET** `/api/database/tables/:id/records`

Query table records.

**Query Parameters:**
- `filters` (optional): JSON filter object
- `sort` (optional): Sort field
- `order` (optional): `asc` | `desc`
- `page` (optional): Page number
- `limit` (optional): Items per page

**Example:**
```
GET /api/database/tables/table_123/records?filters={"department":"Engineering"}&sort=employee_name&order=asc&page=1&limit=20
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "record_123",
        "data": {
          "employee_name": "John Doe",
          "email": "john@example.com",
          "department": "Engineering"
        },
        "createdAt": "2024-01-20T11:00:00Z"
      }
    ],
    "total": 156,
    "page": 1,
    "totalPages": 8
  }
}
```

---

## 📊 Datasets

### Create Dataset

**POST** `/api/datasets`

Create a new dataset/dashboard.

**Request Body:**
```json
{
  "name": "Sales Dashboard",
  "description": "Sales metrics and KPIs",
  "category": "sales"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "dataset_123",
    "name": "Sales Dashboard",
    "status": "DRAFT",
    "sections": [],
    "createdAt": "2024-01-20T12:00:00Z"
  }
}
```

---

### Add Section to Dataset

**POST** `/api/datasets/:id/sections`

Add a section (chart, table, etc.) to dataset.

**Request Body:**
```json
{
  "type": "data-table",
  "title": "Recent Orders",
  "config": {
    "tableId": "orders_table",
    "columns": ["order_id", "customer", "amount", "status"],
    "sortBy": { "field": "created_at", "order": "desc" }
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "section_123",
    "type": "data-table",
    "title": "Recent Orders",
    "order": 1
  }
}
```

---

### Get Dataset with Data

**GET** `/api/datasets/:id/data`

Get dataset with populated data for all sections.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "dataset": {
      "id": "dataset_123",
      "name": "Sales Dashboard",
      "sections": [...]
    },
    "data": {
      "section_123": {
        "records": [
          {
            "order_id": "ORD-001",
            "customer": "Acme Corp",
            "amount": 5000,
            "status": "completed"
          }
        ]
      }
    }
  }
}
```

---

## 🏢 Company & Hierarchy

### Create Department

**POST** `/api/company/departments`

Create a department.

**Request Body:**
```json
{
  "name": "Engineering",
  "description": "Engineering team",
  "parentId": null
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "dept_123",
    "name": "Engineering",
    "parentId": null,
    "employeeCount": 0
  }
}
```

---

### Get Hierarchy Tree

**GET** `/api/company/hierarchy`

Get complete company hierarchy tree.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "dept_123",
      "name": "Engineering",
      "employeeCount": 45,
      "children": [
        {
          "id": "dept_456",
          "name": "Frontend Team",
          "employeeCount": 15,
          "children": []
        }
      ]
    }
  ]
}
```

---

### Create Role

**POST** `/api/company/roles`

Create a role.

**Request Body:**
```json
{
  "name": "Manager",
  "description": "Department manager",
  "departmentId": "dept_123",
  "permissions": {
    "canApprove": true,
    "canReject": true,
    "canViewReports": true
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "role_123",
    "name": "Manager",
    "departmentId": "dept_123",
    "permissions": {...}
  }
}
```

---

## 🔌 Integrations

### Create Integration

**POST** `/api/integrations`

Create an integration.

**Request Body:**
```json
{
  "name": "Order Webhooks",
  "type": "WEBHOOK"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "integration_123",
    "name": "Order Webhooks",
    "type": "WEBHOOK",
    "webhookUrl": "https://api.erpbuilder.com/webhooks/integration_123",
    "isActive": true
  }
}
```

---

### Create Integration Workflow

**POST** `/api/integrations/:id/workflows`

Create an automation workflow for integration.

**Request Body:**
```json
{
  "name": "Create Task on Order",
  "triggerConfig": {
    "event": "webhook_received",
    "filters": { "event_type": "order.created" }
  },
  "actionConfig": {
    "action": "create_task",
    "taskId": "order_task_123"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "workflow_123",
    "name": "Create Task on Order",
    "isActive": true
  }
}
```

---

## 📝 Audit Logs

### Get Audit Logs

**GET** `/api/audit/logs`

Get audit logs with filters.

**Query Parameters:**
- `entity` (optional): Entity type (Task, Flow, etc.)
- `entityId` (optional): Specific entity ID
- `action` (optional): Action performed
- `userId` (optional): User who performed action
- `startDate` (optional): Start date filter
- `endDate` (optional): End date filter
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log_123",
        "userId": "user_123",
        "userName": "John Doe",
        "action": "task.created",
        "entity": "Task",
        "entityId": "task_123",
        "level": "INFO",
        "timestamp": "2024-01-20T10:00:00Z"
      }
    ],
    "total": 500,
    "page": 1,
    "totalPages": 25
  }
}
```

---

### Export Audit Logs

**GET** `/api/audit/logs/export`

Export logs as CSV.

**Query Parameters:** (same as Get Audit Logs)

**Response (200):**
```csv
Timestamp,User,Action,Entity,Level,Details
2024-01-20T10:00:00Z,John Doe,task.created,Task,INFO,Created new task
```

---

## 👥 Users

### List Users

**GET** `/api/users`

Get list of users in company.

**Query Parameters:**
- `role` (optional): Filter by role
- `department` (optional): Filter by department
- `search` (optional): Search in name/email
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_123",
        "email": "john@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "MANAGER",
        "isActive": true
      }
    ],
    "total": 156,
    "page": 1,
    "totalPages": 8
  }
}
```

---

### Update User

**PUT** `/api/users/:id`

Update user details.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "role": "ADMIN"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "role": "ADMIN"
  }
}
```

---

## 📦 Versions

### Create Version

**POST** `/api/versions`

Create a version snapshot of an entity (Task, Flow, Dataset, or CustomTable).

**Authentication:** Required (Developer only)

**Request Body:**
```json
{
  "entityType": "Task",
  "entityId": "task_123",
  "changes": "Updated form fields and validations"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "version_123",
    "version": "1.0.1",
    "entityType": "Task",
    "entityId": "task_123",
    "snapshot": { ... },
    "changes": "Updated form fields and validations",
    "status": "DRAFT",
    "rolloutPercentage": 0,
    "createdBy": "user_123",
    "createdAt": "2024-01-20T10:00:00Z"
  }
}
```

---

### Get Version History

**GET** `/api/versions/:entityType/:entityId`

Get version history for an entity.

**Authentication:** Required (Developer only)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "version_123",
      "version": "1.0.1",
      "status": "PUBLISHED",
      "changes": "Updated form fields",
      "createdAt": "2024-01-20T10:00:00Z",
      "publishedAt": "2024-01-20T11:00:00Z"
    },
    {
      "id": "version_122",
      "version": "1.0.0",
      "status": "STABLE",
      "changes": "Initial version",
      "createdAt": "2024-01-19T10:00:00Z"
    }
  ]
}
```

---

### Publish Version

**POST** `/api/versions/:id/publish`

Publish a version (change status from DRAFT to PUBLISHED).

**Authentication:** Required (Developer only)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "version_123",
    "version": "1.0.1",
    "status": "PUBLISHED",
    "publishedAt": "2024-01-20T11:00:00Z"
  }
}
```

---

### Rollback Version

**POST** `/api/versions/:id/rollback`

Rollback an entity to a previous version.

**Authentication:** Required (Developer only)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Rolled back to version 1.0.0"
  }
}
```

---

## 📤 Export

### Export Company ERP

**GET** `/api/export/:companyId`

Get export package for a company (includes all published tasks, flows, datasets, tables, integrations).

**Authentication:** Required (Developer only)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "company": {
      "id": "company_123",
      "name": "Acme Corp",
      "domain": "acme.erp.com",
      "logo": "https://...",
      "primaryColor": "#3B82F6",
      "secondaryColor": "#1A1F2E"
    },
    "tasks": [...],
    "flows": [...],
    "datasets": [...],
    "tables": [...],
    "integrations": [...],
    "config": {
      "version": "1.0.0",
      "exportedAt": "2024-01-20T10:00:00Z",
      "includesDeveloperPanel": true
    }
  }
}
```

---

### Download Export

**GET** `/api/export/:companyId/download`

Download export package as JSON file.

**Authentication:** Required (Developer only)

**Response (200):**
- Content-Type: `application/json`
- Content-Disposition: `attachment; filename="erp-export-{companyId}-{timestamp}.json"`
- Body: JSON export package

---

## 🏢 Company Switching

### Get Accessible Companies

**GET** `/api/company/accessible`

Get all companies accessible by the current user (developers see all, others see only their company).

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "company_123",
      "name": "Acme Corp",
      "domain": "acme.erp.com",
      "logo": "https://...",
      "primaryColor": "#3B82F6",
      "secondaryColor": "#1A1F2E",
      "isActive": true
    }
  ]
}
```

---

### Switch Company Context

**POST** `/api/company/switch/:companyId`

Switch active company context (developers only).

**Authentication:** Required (Developer only)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "company_123",
    "name": "Acme Corp",
    "domain": "acme.erp.com",
    "logo": "https://...",
    "primaryColor": "#3B82F6",
    "secondaryColor": "#1A1F2E"
  }
}
```

---

## 📊 Standard Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": <response_data>
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {} // Optional additional details
  }
}
```

---

## 🚨 HTTP Status Codes

- **200** OK - Request successful
- **201** Created - Resource created successfully
- **400** Bad Request - Invalid input
- **401** Unauthorized - Missing or invalid token
- **403** Forbidden - Insufficient permissions
- **404** Not Found - Resource not found
- **409** Conflict - Resource already exists
- **422** Unprocessable Entity - Validation error
- **429** Too Many Requests - Rate limit exceeded
- **500** Internal Server Error - Server error

---

## 🔒 Rate Limiting

API rate limits:
- **General endpoints:** 100 requests / 15 minutes
- **Authentication:** 5 requests / 15 minutes
- **File upload:** 10 requests / 15 minutes

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642680000
```

When rate limit exceeded:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 900
  }
}
```

---

## 📖 Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page`: Page number (starts at 1)
- `limit`: Items per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 500,
    "page": 1,
    "totalPages": 25,
    "limit": 20
  }
}
```

---

## 🔍 Filtering & Sorting

Most list endpoints support filtering and sorting:

**Filtering:**
```
GET /api/tasks?status=PUBLISHED&search=employee
```

**Sorting:**
```
GET /api/tasks?sortBy=createdAt&order=desc
```

---

## ✅ API Checklist

**Authentication:**
- [x] POST /api/auth/register
- [x] POST /api/auth/login
- [x] POST /api/auth/refresh
- [x] GET /api/auth/me

**Tasks:**
- [x] POST /api/tasks
- [x] GET /api/tasks
- [x] GET /api/tasks/:id
- [x] PUT /api/tasks/:id
- [x] POST /api/tasks/:id/fields
- [x] PUT /api/tasks/:id/fields/:fieldId
- [x] DELETE /api/tasks/:id/fields/:fieldId
- [x] PUT /api/tasks/:id/fields/reorder
- [x] POST /api/tasks/:id/publish
- [x] DELETE /api/tasks/:id
- [x] POST /api/tasks/:id/duplicate

**Flows:**
- [x] POST /api/flows
- [x] GET /api/flows
- [x] GET /api/flows/:id
- [x] POST /api/flows/:id/levels
- [x] POST /api/flows/:id/levels/:levelId/tasks
- [x] POST /api/flows/:id/branches
- [x] POST /api/flows/:id/start
- [x] GET /api/flows/instances/:id

**Triggers:**
- [x] POST /api/triggers
- [x] GET /api/triggers
- [x] POST /api/triggers/:id/test
- [x] GET /api/triggers/:id/executions

**Database:**
- [x] POST /api/database/tables
- [x] POST /api/database/tables/:id/fields
- [x] POST /api/database/tables/:id/records
- [x] GET /api/database/tables/:id/records

**Versions:**
- [x] POST /api/versions
- [x] GET /api/versions/:entityType/:entityId
- [x] POST /api/versions/:id/publish
- [x] POST /api/versions/:id/rollback

**Export:**
- [x] GET /api/export/:companyId
- [x] GET /api/export/:companyId/download

**Company Switching:**
- [x] GET /api/company/accessible
- [x] POST /api/company/switch/:companyId

**Complete API reference with 60+ endpoints documented!**

---
