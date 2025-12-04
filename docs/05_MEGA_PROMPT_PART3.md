# MEGA PROMPT DOCUMENT - PART 3
# Database Builder, Datasets & Client Portal (Days 91-140)

**Days 91-140 | Data & Client Features Phase**

---

## 🎯 Overview

This document contains prompts for:
- Database Builder (dynamic table creation)
- Dataset Builder (data visualization)
- Company Hierarchy
- Integrations (Gmail, Webhooks)
- Audit Logs
- Client Portal
- Version Manager

---

## 📊 PHASE 6: DATABASE BUILDER (Days 91-105)

### PROMPT 6.1: Database Builder Backend - Dynamic Tables

```
Create Database Builder backend in backend/src/modules/database/:

1. database.types.ts:

export interface ICustomTable {
  id: string;
  name: string; // snake_case (employees, purchase_orders)
  displayName: string; // Human readable (Employees, Purchase Orders)
  description?: string;
  schema: ITableSchema;
  relations: ITableRelation[];
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITableSchema {
  fields: ITableField[];
}

export interface ITableField {
  id: string;
  name: string; // snake_case (employee_name, date_of_birth)
  displayName: string; // Human readable
  type: 'text' | 'number' | 'boolean' | 'date' | 'relation' | 'computed';
  required: boolean;
  unique?: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  // For computed fields
  formula?: string; // e.g., "first_name + ' ' + last_name"
}

export interface ITableRelation {
  id: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  fromTable: string;
  toTable: string;
  fromField: string;
  toField: string;
}

2. database.service.ts:

class DatabaseService {
  // Create custom table
  async createTable(data: {
    name: string;
    displayName: string;
    description?: string;
    companyId: string;
  }): Promise<ICustomTable> {
    // Validate name (snake_case, no spaces)
    // Check if table already exists
    // Create with empty schema
  }

  // Add field to table
  async addField(tableId: string, field: ITableField): Promise<ICustomTable> {
    // Validate field name
    // Add to schema
    // Update table
  }

  // Update field
  async updateField(tableId: string, fieldId: string, updates: Partial<ITableField>): Promise<ICustomTable> {
    // Find and update field
  }

  // Delete field
  async deleteField(tableId: string, fieldId: string): Promise<ICustomTable> {
    // Remove field from schema
    // Note: This doesn't delete data (soft schema change)
  }

  // Create relation
  async createRelation(relation: ITableRelation): Promise<void> {
    // Validate both tables exist
    // Validate fields exist
    // Create relation
  }

  // List tables
  async listTables(companyId: string): Promise<ICustomTable[]> {
    // Return all tables for company
    // Include record counts
  }

  // Get table
  async getTable(id: string): Promise<ICustomTable | null> {
    // Include schema and relations
  }

  // Insert record
  async insertRecord(tableId: string, data: Record<string, any>): Promise<any> {
    // Validate against schema
    // Insert into custom_table_records
    // Return inserted record
  }

  // Query records
  async queryRecords(tableId: string, options: {
    filters?: Record<string, any>;
    sort?: { field: string; order: 'asc' | 'desc' };
    page?: number;
    limit?: number;
  }): Promise<{
    records: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    // Build dynamic query
    // Apply filters
    // Apply sorting
    // Paginate
  }

  // Update record
  async updateRecord(tableId: string, recordId: string, data: Record<string, any>): Promise<any> {
    // Validate against schema
    // Update record
  }

  // Delete record (soft delete)
  async deleteRecord(tableId: string, recordId: string): Promise<void> {
    // Set deletedAt timestamp
  }

  // Import CSV
  async importCSV(tableId: string, file: Express.Multer.File): Promise<{ imported: number; errors: any[] }> {
    // Parse CSV
    // Validate each row
    // Insert valid rows
    // Return results
  }

  // Export CSV
  async exportCSV(tableId: string): Promise<string> {
    // Get all records
    // Convert to CSV
    // Return CSV string
  }
}

Use Prisma for CustomTable and CustomTableRecord models
Validate data against schema before insert/update
Support computed fields (evaluate formula)
```

**TESTING PROMPT 6.1:**
```bash
# Test database service

# 1. Create table
curl -X POST http://localhost:3000/api/database/tables \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "employees",
    "displayName": "Employees",
    "description": "Company employees"
  }'

# 2. Add fields
curl -X POST http://localhost:3000/api/database/tables/<TABLE_ID>/fields \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "employee_name",
    "displayName": "Employee Name",
    "type": "text",
    "required": true
  }'

# 3. Insert record
curl -X POST http://localhost:3000/api/database/tables/<TABLE_ID>/records \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_name": "John Doe",
    "email": "john@example.com"
  }'

# 4. Query records
curl "http://localhost:3000/api/database/tables/<TABLE_ID>/records?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"

# All should work without errors
```

---

## 📈 PHASE 7: DATASET BUILDER (Days 106-115)

### PROMPT 7.1: Dataset Builder Backend

```
Create Dataset Builder in backend/src/modules/datasets/:

1. dataset.types.ts:

export interface IDataset {
  id: string;
  name: string;
  description?: string;
  category?: string;
  sections: IDatasetSection[];
  visibility: {
    roles: string[]; // Which roles can view
    users?: string[]; // Specific users
  };
  companyId: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

export interface IDatasetSection {
  id: string;
  type: 'tasks' | 'data-table' | 'data-chart' | 'data-cards' | 'text';
  title: string;
  config: any; // Type-specific configuration
  order: number;
}

// Section configs:
export interface ITasksSectionConfig {
  taskIds: string[]; // Which tasks to display
  layout: 'list' | 'grid' | 'calendar';
  filters?: {
    status?: string;
    assignedTo?: string;
  };
}

export interface IDataTableConfig {
  tableId: string; // Custom table ID
  columns: string[]; // Field IDs to show
  filters?: Record<string, any>;
  sortBy?: { field: string; order: 'asc' | 'desc' };
}

export interface IDataChartConfig {
  chartType: 'bar' | 'line' | 'pie' | 'area';
  dataSource: {
    tableId: string;
    xAxis: string; // Field for X axis
    yAxis: string; // Field for Y axis
    aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';
  };
}

export interface IDataCardsConfig {
  tableId: string;
  template: string; // Handlebars template
  columns: number; // Cards per row
  limit?: number;
}

2. dataset.service.ts:

class DatasetService {
  // Create dataset
  async createDataset(data: {
    name: string;
    description?: string;
    companyId: string;
  }): Promise<IDataset> {
    // Create with empty sections
  }

  // Add section
  async addSection(datasetId: string, section: IDatasetSection): Promise<IDataset> {
    // Add section to dataset
  }

  // Update section
  async updateSection(datasetId: string, sectionId: string, updates: Partial<IDatasetSection>): Promise<IDataset> {
    // Update section
  }

  // Delete section
  async deleteSection(datasetId: string, sectionId: string): Promise<IDataset> {
    // Remove section
  }

  // Reorder sections
  async reorderSections(datasetId: string, sectionIds: string[]): Promise<IDataset> {
    // Update section order
  }

  // Get dataset with data
  async getDatasetWithData(id: string, userId: string): Promise<{
    dataset: IDataset;
    data: Record<string, any>; // Section ID -> section data
  }> {
    // Check visibility permissions
    // For each section, fetch data based on type:
    // - tasks: Query tasks
    // - data-table: Query custom table records
    // - data-chart: Query and aggregate data
    // - data-cards: Query records
    // Return dataset with populated data
  }

  // Publish dataset
  async publishDataset(id: string): Promise<IDataset> {
    // Set status to PUBLISHED
  }
}

Focus on data aggregation and visualization
Support multiple data sources
Implement visibility controls
```

**TESTING PROMPT 7.1:**
```bash
# Test dataset creation

# 1. Create dataset
curl -X POST http://localhost:3000/api/datasets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sales Dashboard",
    "description": "Sales metrics and reports"
  }'

# 2. Add data table section
curl -X POST http://localhost:3000/api/datasets/<DATASET_ID>/sections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "data-table",
    "title": "Recent Orders",
    "config": {
      "tableId": "orders_table_id",
      "columns": ["order_id", "customer", "amount", "status"],
      "sortBy": { "field": "created_at", "order": "desc" }
    }
  }'

# 3. Get dataset with data
curl http://localhost:3000/api/datasets/<DATASET_ID>/data \
  -H "Authorization: Bearer $TOKEN"

# Should return dataset with populated data
```

---

## 🏢 PHASE 8: COMPANY HIERARCHY (Days 116-120)

### PROMPT 8.1: Company Hierarchy Management

```
Create Company Hierarchy in backend/src/modules/company/:

1. company.service.ts:

class CompanyService {
  // Create department
  async createDepartment(data: {
    name: string;
    description?: string;
    parentId?: string;
    companyId: string;
  }): Promise<IDepartment> {
    // Create department
    // Set hierarchy
  }

  // Update department
  async updateDepartment(id: string, data: Partial<IDepartment>): Promise<IDepartment> {
    // Update department
  }

  // Move department (change parent)
  async moveDepartment(id: string, newParentId: string | null): Promise<IDepartment> {
    // Update parentId
  }

  // Delete department
  async deleteDepartment(id: string): Promise<void> {
    // Check if has children (prevent if yes)
    // Check if has employees (prevent if yes)
    // Delete
  }

  // Get hierarchy tree
  async getHierarchyTree(companyId: string): Promise<IDepartmentTree[]> {
    // Get all departments
    // Build tree structure
    // Include employee counts
  }

  // Create role
  async createRole(data: {
    name: string;
    description?: string;
    departmentId?: string;
    companyId: string;
    permissions: Record<string, boolean>;
  }): Promise<IRole> {
    // Create role
  }

  // Update role
  async updateRole(id: string, data: Partial<IRole>): Promise<IRole> {
    // Update role
  }

  // Assign user to role
  async assignUserToRole(userId: string, roleId: string): Promise<void> {
    // Update user role
  }

  // Get roles by department
  async getRolesByDepartment(departmentId: string): Promise<IRole[]> {
    // Get all roles in department
  }
}

Support nested departments (tree structure)
Include employee counts per department/role
Validate hierarchy changes
```

**TESTING PROMPT 8.1:**
```bash
# Test hierarchy

# 1. Create root department
curl -X POST http://localhost:3000/api/company/departments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Engineering",
    "description": "Engineering team"
  }'

# 2. Create child department
curl -X POST http://localhost:3000/api/company/departments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Frontend Team",
    "description": "Frontend developers",
    "parentId": "<PARENT_DEPT_ID>"
  }'

# 3. Get hierarchy tree
curl http://localhost:3000/api/company/hierarchy \
  -H "Authorization: Bearer $TOKEN"

# Should return nested tree structure
```

---

## 🔌 PHASE 9: INTEGRATIONS (Days 121-130)

### PROMPT 9.1: Integration Framework

```
Create Integration system in backend/src/modules/integrations/:

1. integration.types.ts:

export interface IIntegration {
  id: string;
  name: string;
  type: 'GMAIL' | 'GOOGLE_SHEETS' | 'OUTLOOK' | 'WEBHOOK' | 'CUSTOM_API';
  isActive: boolean;
  config: any; // Type-specific config
  companyId: string;
  workflows: IIntegrationWorkflow[];
  createdAt: Date;
  lastSyncAt?: Date;
}

export interface IIntegrationWorkflow {
  id: string;
  name: string;
  triggerConfig: ITriggerConfig; // When to trigger
  actionConfig: IActionConfig; // What to do
  isActive: boolean;
}

2. connectors/webhook.connector.ts:

class WebhookConnector {
  // Register webhook endpoint
  async registerWebhook(integrationId: string): Promise<{ webhookUrl: string }> {
    // Generate unique webhook URL
    // Store in database
    // Return URL for user to configure
  }

  // Handle incoming webhook
  async handleWebhook(webhookId: string, payload: any): Promise<void> {
    // Find integration
    // Find workflows that match
    // Execute actions
  }
}

3. connectors/gmail.connector.ts:

class GmailConnector {
  // Connect Gmail (OAuth)
  async connect(authCode: string, companyId: string): Promise<IIntegration> {
    // Exchange auth code for tokens
    // Store encrypted tokens
    // Create integration
  }

  // Watch for emails
  async watchEmails(integrationId: string, filters: {
    subject?: string;
    from?: string;
    hasAttachment?: boolean;
  }): Promise<void> {
    // Set up Gmail push notifications
    // When email received, trigger workflow
  }

  // Send email
  async sendEmail(integrationId: string, data: {
    to: string;
    subject: string;
    body: string;
    attachments?: any[];
  }): Promise<void> {
    // Get integration tokens
    // Use Gmail API to send
  }
}

4. integration.service.ts:

class IntegrationService {
  // Create integration
  async createIntegration(data: {
    name: string;
    type: string;
    config: any;
    companyId: string;
  }): Promise<IIntegration> {
    // Validate config
    // Test connection
    // Create integration
  }

  // Create workflow
  async createWorkflow(integrationId: string, workflow: IIntegrationWorkflow): Promise<IIntegrationWorkflow> {
    // Add workflow to integration
  }

  // Execute workflow
  async executeWorkflow(workflowId: string, triggerData: any): Promise<void> {
    // Get workflow
    // Execute actions based on config
    // Log execution
  }
}

Support OAuth for Gmail/Outlook
Secure credential storage (encryption)
Webhook management
Error handling and retries
```

**TESTING PROMPT 9.1:**
```bash
# Test webhook integration

# 1. Create webhook integration
curl -X POST http://localhost:3000/api/integrations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Order Notifications",
    "type": "WEBHOOK"
  }'

# Response includes webhook URL

# 2. Create workflow
curl -X POST http://localhost:3000/api/integrations/<INTEGRATION_ID>/workflows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Create Task on Order",
    "triggerConfig": {
      "event": "webhook_received",
      "filters": { "event_type": "order.created" }
    },
    "actionConfig": {
      "action": "create_task",
      "taskId": "order_processing_task_id"
    }
  }'

# 3. Test webhook
curl -X POST <WEBHOOK_URL> \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "order.created",
    "order_id": "12345",
    "customer": "John Doe"
  }'

# Should create task
```

---

## 📝 PHASE 10: AUDIT LOGS (Days 131-133)

### PROMPT 10.1: Audit Logging System

```
Audit logging is already implemented via middleware.

Enhance in backend/src/modules/audit/:

1. audit.controller.ts:

class AuditController {
  // Get audit logs
  async getLogs(req: Request, res: Response) {
    const {
      entity,
      entityId,
      action,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const logs = await auditService.getLogs({
      companyId: req.user.companyId,
      entity: entity as string,
      entityId: entityId as string,
      action: action as string,
      userId: userId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    res.json({ success: true, data: logs });
  }

  // Export logs
  async exportLogs(req: Request, res: Response) {
    const filters = { ...req.query, companyId: req.user.companyId };
    const csv = await auditService.exportLogsCSV(filters);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    res.send(csv);
  }
}

2. Add audit middleware to all critical operations
3. Include IP address, user agent, request details
4. Support filtering and export
```

**TESTING PROMPT 10.1:**
```bash
# Test audit logs

# 1. Perform some actions (create task, update flow, etc.)

# 2. Get audit logs
curl "http://localhost:3000/api/audit/logs?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"

# 3. Filter by entity
curl "http://localhost:3000/api/audit/logs?entity=Task&action=task.created" \
  -H "Authorization: Bearer $TOKEN"

# 4. Export logs
curl "http://localhost:3000/api/audit/logs/export" \
  -H "Authorization: Bearer $TOKEN" \
  > audit-logs.csv

# Should see all operations logged
```

---

## 👥 PHASE 11: CLIENT PORTAL (Days 134-140)

### PROMPT 11.1: Client Portal Frontend

```
Create Client Portal in frontend/src/features/client-portal/:

1. components/ClientDashboard.tsx:

Layout:
┌─────────────────────────────────────────┐
│ 🏢 Acme Corp        [👤 John Doe ▼]    │
├─────────────────────────────────────────┤
│ Dashboard | My Tasks | Flows | Reports  │
├─────────────────────────────────────────┤
│                                         │
│ Welcome back, John! 👋                  │
│                                         │
│ ┌────────┐ ┌────────┐ ┌────────┐      │
│ │📋 5    │ │⏰ 2    │ │✅ 47   │      │
│ │Pending │ │Urgent  │ │Done    │      │
│ └────────┘ └────────┘ └────────┘      │
│                                         │
│ 📌 My Pending Tasks                     │
│ ┌─────────────────────────────────┐    │
│ │🔴 URGENT - Expense #EXP-1523    │    │
│ │$15,000 • Due: Today 5PM         │    │
│ │[Review Now →]                   │    │
│ └─────────────────────────────────┘    │
│                                         │
│ 🔄 Active Workflows (3)                 │
│ ●━━●━○━○ Expense Approval              │
│ ●━○━○━○ Purchase Order                 │
│                                         │
└─────────────────────────────────────────┘

Features:
- Dashboard with stats
- Pending tasks list
- Active workflows list
- Recent activity

2. components/TaskCompletion.tsx:

Task completion screen:
- Load task definition
- Render form based on fields
- Submit data
- Handle file uploads
- Show validation errors
- Success redirect

3. components/FlowTracking.tsx:

Flow tracking screen:
- Show flow progress
- Current step indicator
- Completed steps
- Pending steps
- Step history

4. Client-specific routes:
/client/dashboard
/client/tasks
/client/tasks/:id/complete
/client/flows
/client/flows/:id
/client/reports

Permissions:
- Clients can only view/complete assigned tasks
- Cannot create/modify tasks or flows
- Cannot access admin features
- Can view datasets with proper permissions

Style consistently with dark theme
Mobile-responsive design
```

**TESTING PROMPT 11.1:**
```bash
# Manual testing:

# 1. Login as client user

# 2. Navigate to /client/dashboard
# - See stats
# - See pending tasks
# - See active workflows

# 3. Click on pending task
# - Should open task completion form
# - Fill form
# - Submit

# 4. Check flow tracking
# - Should show updated progress

# 5. Try accessing admin routes
# - Should redirect or show permission error

# 6. Test on mobile
# - Should be responsive
```

---

## ✅ PART 3 COMPLETE

This completes Days 91-140 covering:
- ✅ Database Builder (dynamic tables)
- ✅ Dataset Builder (data visualization)
- ✅ Company Hierarchy
- ✅ Integrations (Webhook, Gmail)
- ✅ Audit Logs
- ✅ Client Portal

**All core features now complete!**

**Next steps:**
- Testing (comprehensive)
- Bug fixes
- Performance optimization
- Deployment preparation

**Continue to 08_TESTING_DOCUMENTATION.md for testing strategy**

---
