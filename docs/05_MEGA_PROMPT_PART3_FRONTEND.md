# MEGA PROMPT PART 3 - FRONTEND
# Database Builder, Datasets, Company, Integrations, Audit, Client Portal

**Days 91-140 | Frontend Implementation**

---

## 📊 DATABASE BUILDER FRONTEND (Days 106-112)

### PROMPT 6.2: Database Builder Main UI

```
Create Database Builder frontend in frontend/src/features/database-builder/:

FOLDER STRUCTURE:
database-builder/
├── components/
│   ├── DatabaseBuilder.tsx
│   ├── TableList.tsx
│   ├── TableDesigner.tsx
│   ├── FieldEditor.tsx
│   ├── RecordManager.tsx
│   ├── DataTable.tsx
│   ├── ImportExport.tsx
│   └── RelationManager.tsx
├── store/
│   └── databaseStore.ts
├── services/
│   └── database.service.ts
└── types/
    └── database.types.ts

1. database.types.ts - TypeScript interfaces:

export interface ICustomTable {
  id: string;
  name: string; // snake_case
  displayName: string;
  description?: string;
  schema: ITableSchema;
  recordCount: number;
  createdAt: string;
}

export interface ITableSchema {
  fields: ITableField[];
}

export interface ITableField {
  id: string;
  name: string; // snake_case
  displayName: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'relation' | 'computed';
  required: boolean;
  unique?: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface ITableRecord {
  id: string;
  tableId: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

2. database.service.ts - API calls:

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const databaseService = {
  // Tables
  async createTable(data: { name: string; displayName: string; description?: string }) {
    const response = await axios.post(`${API_URL}/database/tables`, data);
    return response.data.data;
  },

  async listTables() {
    const response = await axios.get(`${API_URL}/database/tables`);
    return response.data.data;
  },

  async getTable(id: string) {
    const response = await axios.get(`${API_URL}/database/tables/${id}`);
    return response.data.data;
  },

  async deleteTable(id: string) {
    await axios.delete(`${API_URL}/database/tables/${id}`);
  },

  // Fields
  async addField(tableId: string, field: Partial<ITableField>) {
    const response = await axios.post(`${API_URL}/database/tables/${tableId}/fields`, field);
    return response.data.data;
  },

  async updateField(tableId: string, fieldId: string, data: Partial<ITableField>) {
    const response = await axios.put(`${API_URL}/database/tables/${tableId}/fields/${fieldId}`, data);
    return response.data.data;
  },

  async deleteField(tableId: string, fieldId: string) {
    await axios.delete(`${API_URL}/database/tables/${tableId}/fields/${fieldId}`);
  },

  // Records
  async insertRecord(tableId: string, data: Record<string, any>) {
    const response = await axios.post(`${API_URL}/database/tables/${tableId}/records`, data);
    return response.data.data;
  },

  async queryRecords(tableId: string, params?: {
    filters?: any;
    sort?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const response = await axios.get(`${API_URL}/database/tables/${tableId}/records`, { params });
    return response.data.data;
  },

  async updateRecord(tableId: string, recordId: string, data: Record<string, any>) {
    const response = await axios.put(`${API_URL}/database/tables/${tableId}/records/${recordId}`, data);
    return response.data.data;
  },

  async deleteRecord(tableId: string, recordId: string) {
    await axios.delete(`${API_URL}/database/tables/${tableId}/records/${recordId}`);
  },

  // Import/Export
  async importCSV(tableId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_URL}/database/tables/${tableId}/import`, formData);
    return response.data.data;
  },

  async exportCSV(tableId: string) {
    const response = await axios.get(`${API_URL}/database/tables/${tableId}/export`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

3. databaseStore.ts - State management:

import { create } from 'zustand';

interface DatabaseState {
  tables: ICustomTable[];
  currentTable: ICustomTable | null;
  currentRecords: ITableRecord[];
  isLoading: boolean;
  
  // Actions
  setTables: (tables: ICustomTable[]) => void;
  setCurrentTable: (table: ICustomTable | null) => void;
  setCurrentRecords: (records: ITableRecord[]) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useDatabaseStore = create<DatabaseState>((set) => ({
  tables: [],
  currentTable: null,
  currentRecords: [],
  isLoading: false,
  
  setTables: (tables) => set({ tables }),
  setCurrentTable: (table) => set({ currentTable: table }),
  setCurrentRecords: (records) => set({ currentRecords: records }),
  setIsLoading: (loading) => set({ isLoading: loading })
}));

4. DatabaseBuilder.tsx - Main component:

Layout (3 panels):
┌─────────────────────────────────────────────────────────┐
│  Database Builder                      [+ New Table]    │
├───────────┬─────────────────────────────────┬───────────┤
│           │                                 │           │
│  Tables   │  Table Designer / Records       │ Field     │
│  (20%)    │  (60%)                          │ Props     │
│           │                                 │ (20%)     │
│ ┌───────┐ │ ┌─────────────────────────────┐ │ ┌───────┐ │
│ │📊 Empl│ │ │ Employees Table             │ │ │ Name  │ │
│ │       │ │ │ ┌─┬──────┬──────┬─────────┐ │ │ │ Type  │ │
│ │📊 Orde│ │ │ │#│Name  │Email │Actions  │ │ │ │ Req.  │ │
│ │       │ │ │ ├─┼──────┼──────┼─────────┤ │ │ │ Valid.│ │
│ │📊 Cust│ │ │ │1│John  │j@... │[E] [D]  │ │ │ └───────┘ │
│ │       │ │ │ │2│Jane  │ja... │[E] [D]  │ │ │           │
│ └───────┘ │ │ └─┴──────┴──────┴─────────┘ │ │           │
│           │ │ [+ Add Record]              │ │           │
│           │ │                             │ │           │
│           │ │ Tabs: [Schema] [Data]       │ │           │
│           │ └─────────────────────────────┘ │           │
└───────────┴─────────────────────────────────┴───────────┘

Features:
- Left panel: List of all tables with record counts
- Middle panel: 
  - Schema tab: Field designer with drag-drop
  - Data tab: Records in table format
- Right panel: Selected field properties editor
- Top actions: New table, Delete table, Import/Export

Use shadcn/ui components: Table, Button, Dialog, Input, Select
Style: Dark theme, consistent with rest of app

5. Routes:
/database
/database/:tableId
/database/:tableId/records
```

**TESTING PROMPT 6.2:**
```bash
Manual testing:
1. Navigate to /database
2. Click [+ New Table]
3. Enter name: "employees", display: "Employees"
4. Click Create
5. Click on Employees table
6. Add fields:
   - employee_name (text, required)
   - email (text, required)
   - department (text)
7. Click Schema tab → should see fields
8. Click Data tab → should be empty
9. Click [+ Add Record]
10. Fill data, submit
11. Should see record in table
12. Test edit and delete
```

---

### PROMPT 6.3: Table Designer Component

```
Create TableDesigner.tsx for visual schema design:

Component: TableDesigner

Layout:
┌──────────────────────────────────────────────────────┐
│  Schema Designer                    [+ Add Field]    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ [⋮] employee_name                              │ │
│  │     Type: Text  |  Required ✓  |  [Edit] [Del]│ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ [⋮] email                                       │ │
│  │     Type: Text  |  Required ✓  |  [Edit] [Del]│ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ [⋮] hire_date                                   │ │
│  │     Type: Date  |  Required    |  [Edit] [Del]│ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘

Features:
1. Drag-drop to reorder fields (use @dnd-kit/sortable)
2. Click field to select (shows properties in right panel)
3. Add field button opens modal with:
   - Field name (snake_case, validated)
   - Display name
   - Type dropdown
   - Required checkbox
   - Unique checkbox
   - Default value (type-specific input)
   - Validation rules (min/max for numbers, pattern for text)
4. Edit field button opens same modal with pre-filled data
5. Delete field with confirmation
6. Visual indicators:
   - 🔑 for unique fields
   - ⚠️ for required fields
   - 🔢 for computed fields

State management:
- Store fields in local state
- On save, call API to update table schema
- Optimistic updates with rollback on error

Implement with proper TypeScript types and error handling.
```

---

### PROMPT 6.4: Record Manager Component

```
Create RecordManager.tsx for CRUD operations on records:

Component: RecordManager (Data tab in TableDesigner)

Layout:
┌──────────────────────────────────────────────────────────┐
│  Data                    [Import CSV] [Export CSV]       │
│  ┌──────────────────┐   [+ Add Record]                   │
│  │ Search: [______]│   Filters: [Status ▼] [Clear]      │
│  └──────────────────┘                                     │
├──────────────────────────────────────────────────────────┤
│  ┌────┬────────────┬──────────────┬──────────┬────────┐ │
│  │ #  │ Name       │ Email        │ Dept     │ Actions│ │
│  ├────┼────────────┼──────────────┼──────────┼────────┤ │
│  │ 1  │ John Doe   │ john@co.com  │ Eng      │ [E][D] │ │
│  │ 2  │ Jane Smith │ jane@co.com  │ Sales    │ [E][D] │ │
│  │ 3  │ Bob Johnson│ bob@co.com   │ HR       │ [E][D] │ │
│  └────┴────────────┴──────────────┴──────────┴────────┘ │
│                                                          │
│  Showing 1-20 of 156 records    [< Prev] [Next >]       │
└──────────────────────────────────────────────────────────┘

Features:
1. Data table using @tanstack/react-table:
   - Sortable columns
   - Filterable columns
   - Paginated (20 per page)
   - Selectable rows (for bulk actions)

2. Add Record Modal:
   - Dynamic form based on table schema
   - Field types render appropriate inputs:
     * text → <Input />
     * number → <Input type="number" />
     * date → <DatePicker />
     * boolean → <Checkbox />
     * relation → <Select /> (fetch related records)
   - Validation based on field rules
   - Submit → POST to API

3. Edit Record Modal:
   - Same form as add, pre-filled with record data
   - Submit → PUT to API

4. Delete Record:
   - Confirmation dialog
   - Submit → DELETE to API

5. Search & Filters:
   - Search: Full-text search across all fields
   - Filters: Dropdown per field type
   - Real-time filtering (debounced 300ms)

6. Import CSV:
   - File upload dialog
   - Parse CSV and validate
   - Show preview with errors
   - Bulk insert on confirm

7. Export CSV:
   - Download current filtered data as CSV
   - Include all columns

State management:
- Fetch records on mount
- Update local state on CRUD operations
- Optimistic updates

Error handling:
- Show toast on API errors
- Validate before submit
- Handle network errors
```

---

## 📈 DATASET BUILDER FRONTEND (Days 113-118)

### PROMPT 7.2: Dataset Builder Main UI

```
Create Dataset Builder frontend in frontend/src/features/dataset-builder/:

FOLDER STRUCTURE:
dataset-builder/
├── components/
│   ├── DatasetBuilder.tsx
│   ├── DatasetList.tsx
│   ├── SectionEditor.tsx
│   ├── sections/
│   │   ├── TasksSection.tsx
│   │   ├── DataTableSection.tsx
│   │   ├── DataChartSection.tsx
│   │   ├── DataCardsSection.tsx
│   │   └── TextSection.tsx
│   └── DatasetPreview.tsx
├── store/
│   └── datasetStore.ts
└── services/
    └── dataset.service.ts

1. DatasetBuilder.tsx - Main component:

Layout (3 panels):
┌─────────────────────────────────────────────────────────┐
│  Dataset Builder                    [+ New Dataset]     │
├───────────┬─────────────────────────────────┬───────────┤
│           │                                 │           │
│ Datasets  │  Canvas                         │ Section   │
│ (20%)     │  (60%)                          │ Config    │
│           │                                 │ (20%)     │
│ ┌───────┐ │ ┌─────────────────────────────┐ │ ┌───────┐ │
│ │📊 Sales│ │ │ Sales Dashboard             │ │ │ Type  │ │
│ │       │ │ │                             │ │ │ Title │ │
│ │📊 HR  │ │ │ [+ Add Section ▼]           │ │ │ Config│ │
│ │       │ │ │                             │ │ │       │ │
│ │📊 Ops │ │ │ ┌─────────────────────────┐ │ │ └───────┘ │
│ │       │ │ │ │ Recent Orders           │ │ │           │
│ └───────┘ │ │ │ [Data Table]            │ │ │           │
│           │ │ │ Order | Customer | Amt   │ │ │           │
│           │ │ │ #001  | Acme     | $500  │ │ │           │
│           │ │ └─────────────────────────┘ │ │           │
│           │ │                             │ │           │
│           │ │ ┌─────────────────────────┐ │ │           │
│           │ │ │ Revenue Trend           │ │ │           │
│           │ │ │ [Line Chart]            │ │ │           │
│           │ │ │      📈                  │ │ │           │
│           │ │ └─────────────────────────┘ │ │           │
│           │ └─────────────────────────────┘ │           │
└───────────┴─────────────────────────────────┴───────────┘

Features:
- Left: List of datasets
- Middle: Canvas with sections (drag-drop to reorder)
- Right: Selected section configuration
- Add Section dropdown with 5 types:
  * Tasks (show task list)
  * Data Table (show table data)
  * Data Chart (bar, line, pie)
  * Data Cards (card grid)
  * Text (markdown editor)

2. dataset.service.ts:

export const datasetService = {
  async createDataset(data: { name: string; description?: string }) {
    const response = await axios.post(`${API_URL}/datasets`, data);
    return response.data.data;
  },

  async listDatasets() {
    const response = await axios.get(`${API_URL}/datasets`);
    return response.data.data;
  },

  async getDataset(id: string) {
    const response = await axios.get(`${API_URL}/datasets/${id}`);
    return response.data.data;
  },

  async addSection(datasetId: string, section: any) {
    const response = await axios.post(`${API_URL}/datasets/${datasetId}/sections`, section);
    return response.data.data;
  },

  async updateSection(datasetId: string, sectionId: string, data: any) {
    const response = await axios.put(`${API_URL}/datasets/${datasetId}/sections/${sectionId}`, data);
    return response.data.data;
  },

  async deleteSection(datasetId: string, sectionId: string) {
    await axios.delete(`${API_URL}/datasets/${datasetId}/sections/${sectionId}`);
  },

  async reorderSections(datasetId: string, sectionIds: string[]) {
    await axios.put(`${API_URL}/datasets/${datasetId}/sections/reorder`, { sectionIds });
  },

  async getDatasetWithData(id: string) {
    const response = await axios.get(`${API_URL}/datasets/${id}/data`);
    return response.data.data;
  },

  async publishDataset(id: string) {
    await axios.post(`${API_URL}/datasets/${id}/publish`);
  }
};

3. Implement drag-drop for sections using @dnd-kit
4. Each section type has its own config form
5. Preview mode shows sections with real data
```

**TESTING PROMPT 7.2:**
```bash
1. Create new dataset "Sales Dashboard"
2. Add Data Table section:
   - Select orders table
   - Choose columns: order_id, customer, amount
   - Set sort: created_at DESC
3. Add Data Chart section:
   - Type: Bar chart
   - Data source: orders table
   - X-axis: created_at (grouped by month)
   - Y-axis: amount (sum)
4. Add Data Cards section:
   - Table: customers
   - Template: "{{name}} - {{email}}"
   - Columns: 3
5. Reorder sections by dragging
6. Click Preview
7. Should see all sections with data
8. Publish dataset
```

---

### PROMPT 7.3: Chart Section Component

```
Create DataChartSection.tsx for data visualization:

Use Recharts library for charts.

Component: DataChartSection

Configuration Form:
┌──────────────────────────────────────┐
│  Chart Configuration                 │
├──────────────────────────────────────┤
│  Chart Type: [Bar Chart    ▼]       │
│                                      │
│  Data Source                         │
│  Table: [orders         ▼]          │
│                                      │
│  X-Axis:                             │
│  Field: [created_at     ▼]          │
│  Group by: [month       ▼]          │
│                                      │
│  Y-Axis:                             │
│  Field: [amount         ▼]          │
│  Aggregation: [sum      ▼]          │
│                                      │
│  Filters (Optional):                 │
│  [+ Add Filter]                      │
│                                      │
│  [Cancel]  [Save]                    │
└──────────────────────────────────────┘

Chart Types:
1. Bar Chart (vertical bars)
2. Line Chart (line graph)
3. Pie Chart (circular)
4. Area Chart (filled line)

Aggregations:
- count (count rows)
- sum (sum values)
- avg (average values)
- min (minimum value)
- max (maximum value)

Grouping:
- day, week, month, year (for dates)
- value (for text/numbers)

Display in preview:
- Use Recharts components
- Responsive charts
- Proper axes labels
- Legend
- Tooltips
- Loading state while fetching data

Fetch data from API and transform for chart format.
```

---

## 🏢 COMPANY HIERARCHY FRONTEND (Days 119-122)

### PROMPT 8.2: Company Hierarchy UI

```
Create Company Hierarchy frontend in frontend/src/features/company/:

FOLDER STRUCTURE:
company/
├── components/
│   ├── CompanyHierarchy.tsx
│   ├── DepartmentTree.tsx
│   ├── DepartmentCard.tsx
│   ├── RoleManager.tsx
│   └── UserAssignment.tsx
├── store/
│   └── companyStore.ts
└── services/
    └── company.service.ts

1. CompanyHierarchy.tsx - Main component:

Layout:
┌─────────────────────────────────────────────────────────┐
│  Company Hierarchy          [+ New Department] [+ Role] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Tabs: [Departments] [Roles] [Users]                    │
│                                                         │
│  DEPARTMENTS TAB:                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🏢 Engineering (45 employees)                   │   │
│  │    ├─ 💻 Frontend Team (15 employees)           │   │
│  │    │   └─ [+ Add Sub-department]                │   │
│  │    ├─ ⚙️ Backend Team (20 employees)            │   │
│  │    └─ 🧪 QA Team (10 employees)                 │   │
│  │                                                 │   │
│  │ 🏢 Sales (30 employees)                         │   │
│  │    ├─ 🌍 Regional Sales (20 employees)          │   │
│  │    └─ 📞 Inside Sales (10 employees)            │   │
│  │                                                 │   │
│  │ 🏢 HR (5 employees)                             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ROLES TAB:                                             │
│  ┌──────────────────────┬────────────────────────────┐ │
│  │ Role                 │ Permissions                │ │
│  ├──────────────────────┼────────────────────────────┤ │
│  │ Manager              │ ✓ View  ✓ Edit  ✓ Approve│ │
│  │ Engineering/Frontend │ ✓ View  ✓ Edit            │ │
│  │ Employee             │ ✓ View                    │ │
│  │ Admin                │ ✓ ALL                     │ │
│  └──────────────────────┴────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

2. DepartmentTree.tsx:
- Recursive tree component
- Collapsible nodes
- Drag-drop to move departments
- Context menu: Edit, Delete, Add Child
- Show employee count per department
- Clickable to see details

3. company.service.ts:

export const companyService = {
  // Departments
  async createDepartment(data: {
    name: string;
    description?: string;
    parentId?: string;
  }) {
    const response = await axios.post(`${API_URL}/company/departments`, data);
    return response.data.data;
  },

  async getHierarchyTree() {
    const response = await axios.get(`${API_URL}/company/hierarchy`);
    return response.data.data;
  },

  async updateDepartment(id: string, data: any) {
    const response = await axios.put(`${API_URL}/company/departments/${id}`, data);
    return response.data.data;
  },

  async moveDepartment(id: string, newParentId: string | null) {
    await axios.put(`${API_URL}/company/departments/${id}/move`, { newParentId });
  },

  async deleteDepartment(id: string) {
    await axios.delete(`${API_URL}/company/departments/${id}`);
  },

  // Roles
  async createRole(data: {
    name: string;
    description?: string;
    departmentId?: string;
    permissions: Record<string, boolean>;
  }) {
    const response = await axios.post(`${API_URL}/company/roles`, data);
    return response.data.data;
  },

  async listRoles(departmentId?: string) {
    const response = await axios.get(`${API_URL}/company/roles`, {
      params: { departmentId }
    });
    return response.data.data;
  },

  async updateRole(id: string, data: any) {
    const response = await axios.put(`${API_URL}/company/roles/${id}`, data);
    return response.data.data;
  },

  async deleteRole(id: string) {
    await axios.delete(`${API_URL}/company/roles/${id}`);
  },

  // User assignment
  async assignUserToRole(userId: string, roleId: string) {
    await axios.post(`${API_URL}/company/users/${userId}/assign-role`, { roleId });
  }
};

4. Features:
- Visual tree with expand/collapse
- Add/edit/delete departments
- Move departments (drag-drop)
- Create/edit roles with permissions
- Assign users to roles
- Search departments and roles
```

**TESTING PROMPT 8.2:**
```bash
1. Navigate to /company
2. View Departments tab
3. Click [+ New Department]
4. Create "Engineering" (no parent)
5. Click Engineering
6. Click [+ Add Sub-department]
7. Create "Frontend Team" (parent: Engineering)
8. Drag Frontend Team to reorder
9. Switch to Roles tab
10. Create role "Manager" with permissions
11. Assign user to role
```

---

## 🔌 INTEGRATIONS FRONTEND (Days 123-127)

### PROMPT 9.2: Integrations UI

```
Create Integrations frontend in frontend/src/features/integrations/:

FOLDER STRUCTURE:
integrations/
├── components/
│   ├── IntegrationsList.tsx
│   ├── IntegrationCard.tsx
│   ├── ConnectModal.tsx
│   ├── WorkflowEditor.tsx
│   └── connectors/
│       ├── WebhookConnector.tsx
│       ├── GmailConnector.tsx
│       └── GenericConnector.tsx
├── store/
│   └── integrationsStore.ts
└── services/
    └── integrations.service.ts

1. IntegrationsList.tsx - Main component:

Layout:
┌─────────────────────────────────────────────────────────┐
│  Integrations                    [+ Add Integration]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Available Integrations:                                │
│  ┌─────────┬─────────┬─────────┬─────────┐             │
│  │ 📧 Gmail│ 📊 Sheet│ 🪝 Hook │ 🔗 API  │             │
│  │ Connect │ Connect │ Connect │ Connect │             │
│  └─────────┴─────────┴─────────┴─────────┘             │
│                                                         │
│  Connected Integrations:                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🪝 Order Webhooks               ● Active        │   │
│  │    Webhook URL: https://api.../webhooks/xyz     │   │
│  │    Workflows: 2 active                          │   │
│  │    Last triggered: 5 minutes ago                │   │
│  │    [View Workflows] [Settings] [Delete]         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📧 Gmail - john@company.com     ● Active        │   │
│  │    Connected: 2 days ago                        │   │
│  │    Workflows: 1 active                          │   │
│  │    [View Workflows] [Settings] [Disconnect]     │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

2. integrations.service.ts:

export const integrationsService = {
  async listIntegrations() {
    const response = await axios.get(`${API_URL}/integrations`);
    return response.data.data;
  },

  async createIntegration(data: {
    name: string;
    type: string;
    config?: any;
  }) {
    const response = await axios.post(`${API_URL}/integrations`, data);
    return response.data.data;
  },

  async deleteIntegration(id: string) {
    await axios.delete(`${API_URL}/integrations/${id}`);
  },

  // Gmail OAuth
  async connectGmail() {
    // Redirect to OAuth flow
    window.location.href = `${API_URL}/integrations/gmail/connect`;
  },

  async handleGmailCallback(code: string) {
    const response = await axios.post(`${API_URL}/integrations/gmail/callback`, { code });
    return response.data.data;
  },

  // Workflows
  async createWorkflow(integrationId: string, workflow: any) {
    const response = await axios.post(
      `${API_URL}/integrations/${integrationId}/workflows`,
      workflow
    );
    return response.data.data;
  },

  async listWorkflows(integrationId: string) {
    const response = await axios.get(
      `${API_URL}/integrations/${integrationId}/workflows`
    );
    return response.data.data;
  },

  async updateWorkflow(integrationId: string, workflowId: string, data: any) {
    const response = await axios.put(
      `${API_URL}/integrations/${integrationId}/workflows/${workflowId}`,
      data
    );
    return response.data.data;
  },

  async deleteWorkflow(integrationId: string, workflowId: string) {
    await axios.delete(
      `${API_URL}/integrations/${integrationId}/workflows/${workflowId}`
    );
  },

  async testWorkflow(integrationId: string, workflowId: string, testData: any) {
    const response = await axios.post(
      `${API_URL}/integrations/${integrationId}/workflows/${workflowId}/test`,
      testData
    );
    return response.data.data;
  }
};

3. ConnectModal for Webhook:
- Show webhook URL (copy button)
- Explain how to use
- Show example payload
- Test webhook button

4. ConnectModal for Gmail:
- "Connect with Google" button
- OAuth flow
- Show connected email
- Disconnect button

5. WorkflowEditor:
- Trigger configuration (event type, filters)
- Action configuration (what to do)
- Test workflow with sample data
- View execution logs
```

**TESTING PROMPT 9.2:**
```bash
1. Navigate to /integrations
2. Click Webhook card
3. Create new webhook integration
4. Copy webhook URL
5. Create workflow:
   - Trigger: webhook received
   - Filter: event_type = "order.created"
   - Action: create task
6. Test webhook with curl
7. Verify task created
8. Check execution logs
```

---

## 📝 AUDIT LOGS FRONTEND (Days 128-130)

### PROMPT 10.2: Audit Logs UI

```
Create Audit Logs frontend in frontend/src/features/audit-logs/:

FOLDER STRUCTURE:
audit-logs/
├── components/
│   ├── AuditLogs.tsx
│   ├── LogTable.tsx
│   ├── LogFilters.tsx
│   └── LogDetails.tsx
├── store/
│   └── auditStore.ts
└── services/
    └── audit.service.ts

1. AuditLogs.tsx - Main component:

Layout:
┌─────────────────────────────────────────────────────────┐
│  Audit Logs                           [Export CSV]      │
├─────────────────────────────────────────────────────────┤
│  Filters:                                               │
│  Entity: [All     ▼] Action: [All    ▼] User: [All ▼]  │
│  Date: [Last 7 Days ▼]  Search: [_____________]         │
│  [Apply Filters] [Clear]                                │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┬───────┬──────┬────────┬──────┬─────────┐ │
│  │Timestamp │User   │Action│Entity  │Level │Details  │ │
│  ├──────────┼───────┼──────┼────────┼──────┼─────────┤ │
│  │10:45 AM  │John D │Create│Task    │INFO  │[View]   │ │
│  │10:42 AM  │Jane S │Update│Flow    │INFO  │[View]   │ │
│  │10:40 AM  │Admin  │Delete│User    │WARN  │[View]   │ │
│  │10:35 AM  │System │Error │Trigger │ERROR │[View]   │ │
│  └──────────┴───────┴──────┴────────┴──────┴─────────┘ │
│                                                         │
│  Showing 1-20 of 1,543 logs    [< Prev] [Next >]       │
└─────────────────────────────────────────────────────────┘

2. audit.service.ts:

export const auditService = {
  async getLogs(params: {
    entity?: string;
    entityId?: string;
    action?: string;
    userId?: string;
    level?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await axios.get(`${API_URL}/audit/logs`, { params });
    return response.data.data;
  },

  async getLogDetails(id: string) {
    const response = await axios.get(`${API_URL}/audit/logs/${id}`);
    return response.data.data;
  },

  async exportLogs(params: any) {
    const response = await axios.get(`${API_URL}/audit/logs/export`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  }
};

3. LogDetails modal:
- Full timestamp
- User details
- Action performed
- Entity type and ID
- Changes (before/after)
- Metadata (IP, user agent)
- Request details

4. LogFilters:
- Entity type dropdown (Task, Flow, Trigger, etc.)
- Action dropdown (created, updated, deleted, etc.)
- User dropdown (all users in company)
- Level dropdown (INFO, WARN, ERROR, CRITICAL)
- Date range picker
- Search input (searches all fields)

5. Export:
- Export filtered logs as CSV
- Include all columns
- Download file

Features:
- Real-time updates (poll every 30 seconds)
- Color coding by level:
  * INFO: blue
  * WARN: yellow
  * ERROR: red
  * CRITICAL: dark red
- Expandable rows for details
- Sortable columns
- Pagination
```

**TESTING PROMPT 10.2:**
```bash
1. Navigate to /audit-logs
2. Should see logs table
3. Apply filters:
   - Entity: Task
   - Action: created
   - Date: Last 24 hours
4. Click [Apply Filters]
5. Should see filtered results
6. Click [View] on a log
7. Should see detailed modal
8. Click [Export CSV]
9. Should download file
10. Test real-time updates (perform action, wait 30s)
```

---

## 👥 CLIENT PORTAL FRONTEND (Days 131-140)

### PROMPT 11.2: Client Portal Dashboard

```
Create Client Portal in frontend/src/features/client-portal/:

FOLDER STRUCTURE:
client-portal/
├── components/
│   ├── ClientDashboard.tsx
│   ├── PendingTasks.tsx
│   ├── TaskCompletion.tsx
│   ├── FlowTracking.tsx
│   └── ClientLayout.tsx
├── store/
│   └── clientStore.ts
└── services/
    └── client.service.ts

1. ClientLayout.tsx - Different from admin layout:

Layout:
┌─────────────────────────────────────────────────────────┐
│  🏢 Acme Corp            Dashboard    [👤 John Doe ▼]   │
├─────────────────────────────────────────────────────────┤
│  [Dashboard] [My Tasks] [My Flows] [Reports]            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  (Page content here)                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘

Simple, clean navigation.
No access to admin features (Task Builder, Flow Builder, etc.)

2. ClientDashboard.tsx:

Layout:
┌─────────────────────────────────────────────────────────┐
│  Welcome back, John! 👋                                 │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │📋 5      │  │⏰ 2      │  │✅ 47     │             │
│  │Pending   │  │Urgent    │  │Completed │             │
│  │Tasks     │  │Tasks     │  │This Month│             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                         │
│  📌 My Pending Tasks                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🔴 URGENT - Expense Approval #EXP-1523          │   │
│  │    $15,000 • Due: Today 5PM                     │   │
│  │    [Review Now →]                               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🟡 Expense Approval #EXP-1524                   │   │
│  │    $450 • Due: Tomorrow                         │   │
│  │    [Review Now →]                               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  🔄 Active Workflows (3)                                │
│  ●━━●━○━○  Expense Approval (#EXP-1523)                │
│  ●━○━○━○  Purchase Order (#PO-445)                     │
│  ●━━━●━○  Leave Request (#LR-89)                       │
│                                                         │
└─────────────────────────────────────────────────────────┘

3. client.service.ts:

export const clientService = {
  async getDashboardStats() {
    const response = await axios.get(`${API_URL}/client/dashboard`);
    return response.data.data;
  },

  async getMyTasks(status?: string) {
    const response = await axios.get(`${API_URL}/client/tasks`, {
      params: { status }
    });
    return response.data.data;
  },

  async getTask(taskExecutionId: string) {
    const response = await axios.get(`${API_URL}/client/tasks/${taskExecutionId}`);
    return response.data.data;
  },

  async submitTask(taskExecutionId: string, data: any) {
    const response = await axios.post(
      `${API_URL}/client/tasks/${taskExecutionId}/submit`,
      data
    );
    return response.data.data;
  },

  async getMyFlows() {
    const response = await axios.get(`${API_URL}/client/flows`);
    return response.data.data;
  },

  async getFlowInstance(instanceId: string) {
    const response = await axios.get(`${API_URL}/client/flows/${instanceId}`);
    return response.data.data;
  }
};

4. Routes:
/client/dashboard
/client/tasks
/client/tasks/:id/complete
/client/flows
/client/flows/:id
```

---

### PROMPT 11.3: Task Completion Interface

```
Create TaskCompletion.tsx for clients to fill forms:

Layout:
┌─────────────────────────────────────────────────────────┐
│  ← Back to Tasks                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Expense Approval                                       │
│  Submitted by: Jane Smith • 2 hours ago                 │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Employee Name:                                  │   │
│  │ Jane Smith                                      │   │
│  │                                                 │   │
│  │ Amount:                                         │   │
│  │ $15,000.00                                      │   │
│  │                                                 │   │
│  │ Category:                                       │   │
│  │ Travel                                          │   │
│  │                                                 │   │
│  │ Receipt:                                        │   │
│  │ 📎 receipt.pdf (254 KB)                        │   │
│  │                                                 │   │
│  │ Description:                                    │   │
│  │ Conference travel to New York...                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Your Response:                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Decision: [Approve ▼]                           │   │
│  │                                                 │   │
│  │ Comments:                                       │   │
│  │ [_____________________________________]         │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Cancel]                    [Submit Response]          │
│                                                         │
└─────────────────────────────────────────────────────────┘

Features:
1. Load task execution
2. Show submitted data (read-only)
3. Show task fields to fill
4. Dynamic form based on task definition
5. File uploads
6. Form validation
7. Submit → POST to API
8. Success → Redirect to dashboard

If task has been completed, show read-only view.
```

---

### PROMPT 11.4: Flow Tracking Interface

```
Create FlowTracking.tsx for viewing workflow progress:

Layout:
┌─────────────────────────────────────────────────────────┐
│  ← Back to Flows                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Expense Approval Workflow                              │
│  Instance #EXP-1523 • Started: Nov 27, 2024 10:00 AM   │
│                                                         │
│  Progress: ●━━●━○━○  (2 of 4 steps completed)          │
│                                                         │
│  Timeline:                                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ✅ Step 1: Employee Submission                  │   │
│  │    Completed by: Jane Smith                     │   │
│  │    Completed: Nov 27, 10:00 AM                  │   │
│  │    [View Details]                               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ⏳ Step 2: Manager Review (Current)             │   │
│  │    Assigned to: You (John Doe)                  │   │
│  │    Due: Today 5:00 PM                           │   │
│  │    [Complete Task]                              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ⚪ Step 3: Finance Approval (Pending)           │   │
│  │    Waiting for previous step                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ⚪ Step 4: Payment Processing (Pending)         │   │
│  │    Waiting for previous step                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘

Features:
1. Visual timeline of all steps
2. Status indicators (completed, current, pending)
3. Show who completed each step
4. Show when each step was completed
5. Link to complete current task
6. Expand to see task details
7. Real-time updates (poll every 30s)

Status colors:
- ✅ Completed: Green
- ⏳ Current: Blue
- ⚪ Pending: Gray
```

**TESTING PROMPT 11.3-11.4:**
```bash
# Test as client user:

1. Login as client (not admin)
2. Navigate to /client/dashboard
3. Should see stats and pending tasks
4. Click on urgent task
5. Should see task details
6. Fill response form
7. Submit
8. Should redirect to dashboard
9. Task should be marked complete
10. Navigate to /client/flows
11. Click on active flow
12. Should see progress timeline
13. Current step should be highlighted
14. Click [Complete Task] on current step
15. Should open task completion form
```

---

## ✅ IMPLEMENTATION CHECKLIST

Copy each prompt to Cursor AI in order:

**Week 1 (Days 106-112): Database Builder**
- [ ] PROMPT 6.2: Database Builder Main UI
- [ ] PROMPT 6.3: Table Designer
- [ ] PROMPT 6.4: Record Manager
- [ ] Test: Create table, add fields, insert records

**Week 2 (Days 113-118): Dataset Builder**
- [ ] PROMPT 7.2: Dataset Builder Main UI
- [ ] PROMPT 7.3: Chart Section Component
- [ ] Test: Create dataset, add sections, view with data

**Week 3 (Days 119-122): Company Hierarchy**
- [ ] PROMPT 8.2: Company Hierarchy UI
- [ ] Test: Create departments, create roles, assign users

**Week 4 (Days 123-127): Integrations**
- [ ] PROMPT 9.2: Integrations UI
- [ ] Test: Create webhook, create workflow, test trigger

**Week 5 (Days 128-130): Audit Logs**
- [ ] PROMPT 10.2: Audit Logs UI
- [ ] Test: View logs, filter, export CSV

**Week 6 (Days 131-140): Client Portal**
- [ ] PROMPT 11.2: Client Portal Dashboard
- [ ] PROMPT 11.3: Task Completion Interface
- [ ] PROMPT 11.4: Flow Tracking Interface
- [ ] Test: Complete workflow as client user

---

## 🎯 AFTER COMPLETING THESE:

You'll have **100% complete frontend** for all features!

Then proceed to:
1. **Days 141-150:** Testing & Bug Fixes (my previous response)
2. **Days 151-160:** Deployment

---

**Ready to start? Begin with PROMPT 6.2 for Database Builder!** 🚀
