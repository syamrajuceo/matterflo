# Frontend Pages and Sections - Complete Specification

## 📋 Table of Contents
1. [Authentication Pages](#authentication-pages)
2. [Dashboard](#dashboard)
3. [Task Builder](#task-builder)
4. [Flow Builder](#flow-builder)
5. [Triggers](#triggers)
6. [Execution & My Tasks](#execution--my-tasks)
7. [Custom Database](#custom-database)
8. [Datasets & Reporting](#datasets--reporting)
9. [Company Management](#company-management)
10. [Integrations](#integrations)
11. [Audit Logs](#audit-logs)
12. [Client Portal](#client-portal)
13. [Settings](#settings)

---

## Authentication Pages

### 1. Login Page (`/login`)
**Route:** `/login`  
**Access:** Public  
**Layout:** Auth Layout (centered, no sidebar)

#### Sections:
- **Header Section**
  - Logo/Brand name
  - "Login to your account" title
  - "Enter your email below to login to your account" description

- **Login Form Section**
  - Email input field
  - Password input field
  - "Forgot your password?" link
  - "Login" button (primary action)
  - "Login with Google" button (secondary action)
  - "Don't have an account? Sign up" link

- **Footer Section**
  - Terms of Service link
  - Privacy Policy link

**API Endpoints:**
- `POST /api/auth/login`

---

### 2. Register Page (`/register`)
**Route:** `/register`  
**Access:** Public  
**Layout:** Auth Layout (centered, no sidebar)

#### Sections:
- **Header Section**
  - Logo/Brand name
  - "Create an account" title
  - "Enter your information to get started" description

- **Registration Form Section**
  - First Name input field
  - Last Name input field
  - Email input field
  - Password input field
  - Company Name input field (optional)
  - "Create account" button
  - "Already have an account? Sign in" link

- **Footer Section**
  - Terms of Service link
  - Privacy Policy link

**API Endpoints:**
- `POST /api/auth/register`

---

### 3. Forgot Password Page (`/forgot-password`)
**Route:** `/forgot-password`  
**Access:** Public  
**Layout:** Auth Layout

#### Sections:
- **Header Section**
  - Logo/Brand name
  - "Reset your password" title
  - "Enter your email to receive reset instructions" description

- **Reset Form Section**
  - Email input field
  - "Send reset link" button
  - "Back to login" link

**API Endpoints:**
- `POST /api/auth/forgot-password` (if implemented)

---

## Dashboard

### 4. Main Dashboard (`/dashboard`)
**Route:** `/dashboard`  
**Access:** Authenticated (All roles)  
**Layout:** Main Layout (with sidebar)

#### Sections:
- **Header Section**
  - Page title: "Dashboard"
  - Breadcrumb navigation
  - User profile dropdown
  - Notifications icon

- **Statistics Cards Section**
  - Total Tasks card
    - Count display
    - Trend indicator (up/down with percentage)
    - Description: "Active tasks across all flows"
  - Active Flows card
    - Count display
    - Trend indicator
    - Description: "Workflows currently running"
  - Completed Tasks card
    - Count display
    - Trend indicator
    - Description: "Tasks completed this month"
  - Pending Reviews card
    - Count display
    - Trend indicator
    - Description: "Tasks awaiting approval"

- **Activity Chart Section**
  - Chart title: "Total Visitors" or "Activity Overview"
  - Time range selector (Last 3 months, Last 30 days, Last 7 days)
  - Area/Line chart showing activity over time
  - Chart legend

- **Recent Activity Section**
  - Table/list of recent activities
  - Columns: Date, Action, User, Entity, Details
  - Pagination controls

- **Quick Actions Section**
  - "Create Task" button
  - "Create Flow" button
  - "View My Tasks" button
  - "View All Flows" button

**API Endpoints:**
- `GET /api/auth/me`
- `GET /api/executions/tasks/my-tasks` (for statistics)
- `GET /api/executions/flows/my-flows` (for statistics)
- `GET /api/audit/logs` (for recent activity)

---

## Task Builder

### 5. Tasks List Page (`/tasks`)
**Route:** `/tasks`  
**Access:** Authenticated (DEVELOPER, ADMIN)  
**Layout:** Main Layout

#### Sections:
- **Header Section**
  - Page title: "Tasks"
  - "Create New Task" button
  - Search bar
  - Filter dropdown (Status: Draft, Published, Archived, Deprecated)
  - View toggle (Grid/List)

- **Tasks Table/Grid Section**
  - Task cards or table rows showing:
    - Task name
    - Description
    - Status badge
    - Version number
    - Number of fields
    - Created date
    - Last updated date
    - Actions menu (Edit, Duplicate, Publish, Archive, Delete)

- **Pagination Section**
  - Page numbers
  - Items per page selector
  - Previous/Next buttons

**API Endpoints:**
- `GET /api/tasks` (with query params: status, search, page, limit)
- `DELETE /api/tasks/{id}`

---

### 6. Task Builder Page (`/tasks/new` or `/tasks/:id/edit`)
**Route:** `/tasks/new` or `/tasks/:id/edit`  
**Access:** Authenticated (DEVELOPER, ADMIN)  
**Layout:** Main Layout

#### Sections:
- **Header Section**
  - Task name input (editable)
  - Save button
  - Publish button (if draft)
  - Preview button
  - Back to list button

- **Left Sidebar - Task Configuration**
  - **Basic Information Section**
    - Name field
    - Description textarea
    - Version display (read-only)
    - Status badge
  - **Settings Section**
    - Auto-assign toggle
    - Allow multiple submissions toggle
    - Submission deadline date picker
    - Notification settings

- **Center Canvas - Form Builder**
  - **Field Palette Section** (collapsible)
    - Available field types:
      - Text
      - Number
      - Date
      - Dropdown
      - Multi-select
      - Checkbox
      - File upload
      - Image upload
      - Rich text
      - Field group
    - Drag-and-drop functionality

  - **Form Canvas Section**
    - Droppable area for fields
    - Field cards showing:
      - Field label
      - Field type icon
      - Required indicator
      - Drag handle
      - Edit button
      - Delete button
    - Empty state when no fields
    - Field reordering (drag-and-drop)

- **Right Sidebar - Field Properties** (when field selected)
  - **Field Configuration Section**
    - Field type selector
    - Label input
    - Placeholder input
    - Required checkbox
    - Default value input
    - Help text textarea
  - **Validation Section**
    - Min length/max length (for text)
    - Min value/max value (for number)
    - Pattern/regex (for text)
    - Custom validation rules
  - **Conditional Logic Section**
    - Show/hide conditions
    - Conditional field dependencies
    - Rule builder interface
  - **Advanced Options Section**
    - Field visibility rules
    - Field grouping
    - Custom CSS classes

- **Bottom Action Bar**
  - Save Draft button
  - Publish button
  - Cancel button
  - Version history link

**API Endpoints:**
- `GET /api/tasks/{id}` (for edit)
- `POST /api/tasks` (for create)
- `PUT /api/tasks/{id}` (for update)
- `POST /api/tasks/{id}/fields` (add field)
- `PUT /api/tasks/{id}/fields/{fieldId}` (update field)
- `DELETE /api/tasks/{id}/fields/{fieldId}` (delete field)
- `PUT /api/tasks/{id}/fields/reorder` (reorder fields)
- `POST /api/tasks/{id}/publish` (publish task)

---

### 7. Task Preview Page (`/tasks/:id/preview`)
**Route:** `/tasks/:id/preview`  
**Access:** Authenticated (All roles)  
**Layout:** Main Layout

#### Sections:
- **Header Section**
  - Task name
  - Back button
  - Edit button (if user has permission)

- **Preview Section**
  - Rendered form preview (as it would appear to users)
  - All fields displayed
  - Submit button (disabled, for preview only)
  - Form validation preview

**API Endpoints:**
- `GET /api/tasks/{id}`

---

## Flow Builder

### 8. Flows List Page (`/flows`)
**Route:** `/flows`  
**Access:** Authenticated (DEVELOPER, ADMIN, MANAGER)  
**Layout:** Main Layout

#### Sections:
- **Header Section**
  - Page title: "Flows"
  - "Create New Flow" button
  - Search bar
  - Filter dropdown (Status, Active/Inactive)
  - View toggle (Grid/List)

- **Flows Table/Grid Section**
  - Flow cards or table rows showing:
    - Flow name
    - Description
    - Status badge
    - Number of levels
    - Number of tasks
    - Created date
    - Last updated date
    - Actions menu (Edit, Duplicate, Publish, Archive, Delete, View Instances)

- **Pagination Section**
  - Page numbers
  - Items per page selector
  - Previous/Next buttons

**API Endpoints:**
- `GET /api/flows` (with query params: status, search, page, limit)
- `DELETE /api/flows/{id}`

---

### 9. Flow Builder Page (`/flows/new` or `/flows/:id/edit`)
**Route:** `/flows/new` or `/flows/:id/edit`  
**Access:** Authenticated (DEVELOPER, ADMIN)  
**Layout:** Main Layout

#### Sections:
- **Header Section**
  - Flow name input (editable)
  - Save button
  - Publish button (if draft)
  - Preview button
  - Back to list button

- **Left Sidebar - Flow Configuration**
  - **Basic Information Section**
    - Name field
    - Description textarea
    - Status badge
    - Version display
  - **Settings Section**
    - Auto-progression toggle
    - Allow parallel execution toggle
    - Notification settings
    - Completion criteria

- **Center Canvas - Flow Diagram**
  - **Visual Flow Builder**
    - Level nodes (vertical/horizontal layout)
    - Task nodes within levels
    - Branch connectors between levels
    - Drag-and-drop for reordering
    - Zoom controls
    - Pan controls
    - Minimap (optional)

  - **Level Configuration Panel** (when level selected)
    - Level name
    - Level description
    - Assigned roles
    - Tasks in level
    - Add task button
    - Level order controls

  - **Branch Configuration Panel** (when branch selected)
    - Branch name
    - From level selector
    - To level selector
    - Condition builder
    - Condition logic (AND/OR)
    - Condition rules

- **Right Sidebar - Task Assignment**
  - **Available Tasks Section**
    - List of published tasks
    - Search/filter tasks
    - Drag to add to level
  - **Level Tasks Section** (when level selected)
    - Tasks assigned to level
    - Task order controls
    - Remove task button

- **Bottom Action Bar**
  - Save Draft button
  - Publish button
  - Test Flow button
  - Cancel button
  - Version history link

**API Endpoints:**
- `GET /api/flows/{id}` (for edit)
- `POST /api/flows` (for create)
- `PUT /api/flows/{id}` (for update)
- `POST /api/flows/{id}/levels` (add level)
- `PUT /api/flows/{id}/levels/{levelId}` (update level)
- `DELETE /api/flows/{id}/levels/{levelId}` (delete level)
- `PUT /api/flows/{id}/levels/reorder` (reorder levels)
- `POST /api/flows/{id}/levels/{levelId}/tasks` (add task to level)
- `DELETE /api/flows/{id}/levels/{levelId}/tasks/{taskId}` (remove task)
- `PUT /api/flows/{id}/levels/{levelId}/tasks/reorder` (reorder tasks)
- `POST /api/flows/{id}/branches` (create branch)
- `PUT /api/flows/{id}/branches/{branchId}` (update branch)
- `DELETE /api/flows/{id}/branches/{branchId}` (delete branch)
- `POST /api/flows/{id}/levels/{levelId}/roles` (add role to level)
- `DELETE /api/flows/{id}/levels/{levelId}/roles/{roleId}` (remove role)
- `POST /api/flows/{id}/publish` (publish flow)
- `POST /api/flows/{id}/duplicate` (duplicate flow)

---

### 10. Flow Instances Page (`/flows/:id/instances`)
**Route:** `/flows/:id/instances`  
**Access:** Authenticated (All roles)  
**Layout:** Main Layout

#### Sections:
- **Header Section**
  - Flow name
  - "Start New Instance" button
  - Back to flow button

- **Instances Table Section**
  - Columns:
    - Instance ID
    - Started by
    - Start date
    - Current level
    - Status (In Progress, Completed, Paused, Cancelled)
    - Progress percentage
    - Actions (View Details, Cancel)

- **Filters Section**
  - Status filter
  - Date range filter
  - Started by filter

- **Pagination Section**

**API Endpoints:**
- `GET /api/executions/flows` (filtered by flowId)
- `POST /api/executions/flows` (start new instance)
- `GET /api/executions/flows/{id}` (get instance details)

---

## Triggers

### 11. Triggers List Page (`/triggers`)
**Route:** `/triggers`  
**Access:** Authenticated (DEVELOPER, ADMIN)  
**Layout:** Main Layout

#### Sections:
- **Header Section**
  - Page title: "Triggers"
  - "Create New Trigger" button
  - Search bar
  - Filter dropdowns:
    - Event Type filter
    - Task filter
    - Flow filter
    - Active/Inactive toggle

- **Triggers Table Section**
  - Columns:
    - Trigger name
    - Event type
    - Associated entity (Task/Flow)
    - Actions count
    - Status (Active/Inactive)
    - Last triggered date
    - Created date
    - Actions menu (Edit, Test, Toggle Active, Delete)

- **Pagination Section**

**API Endpoints:**
- `GET /api/triggers` (with query params: taskId, flowId, eventType, isActive)
- `DELETE /api/triggers/{id}`

---

### 12. Trigger Builder Page (`/triggers/new` or `/triggers/:id/edit`)
**Route:** `/triggers/new` or `/triggers/:id/edit`  
**Access:** Authenticated (DEVELOPER, ADMIN)  
**Layout:** Main Layout

#### Sections:
- **Header Section**
  - Trigger name input
  - Save button
  - Test Trigger button
  - Toggle Active button
  - Back button

- **Left Sidebar - Trigger Configuration**
  - **Basic Information Section**
    - Name field
    - Description textarea
    - Active toggle
  - **Event Configuration Section**
    - Event type selector:
      - Task Created
      - Task Completed
      - Task Updated
      - Flow Started
      - Flow Completed
      - Flow Level Completed
      - Custom Event
    - Entity selector (Task/Flow)
    - Entity ID selector (dropdown of tasks/flows)

- **Center Section - Condition Builder**
  - **Conditions Section**
    - Condition logic selector (AND/OR)
    - Condition rules list:
      - Field selector
      - Operator selector (equals, contains, greater than, etc.)
      - Value input
      - Add condition button
      - Remove condition button

- **Right Sidebar - Actions Configuration**
  - **Actions List Section**
    - List of configured actions
    - Add Action button
    - Action type selector:
      - Send Email
      - Trigger Flow
      - Create Task
      - Update Database
      - Call Webhook
      - Custom API Call

  - **Action Configuration Panel** (when action selected)
    - Action type display
    - Action-specific configuration:
      - **Email Action:**
        - Recipient(s)
        - Subject
        - Body template
        - Attachment options
      - **Flow Action:**
        - Flow selector
        - Context data mapping
      - **Task Action:**
        - Task selector
        - Assignee selector
        - Due date
      - **Database Action:**
        - Table selector
        - Operation (Insert/Update/Delete)
        - Data mapping
      - **Webhook Action:**
        - URL
        - Method (POST/PUT/PATCH)
        - Headers
        - Body template
      - **Custom API Action:**
        - Endpoint URL
        - Method
        - Headers
        - Body template
    - Remove action button

- **Bottom Section - Test & Preview**
  - Test trigger button
  - Test results display
  - Execution log

**API Endpoints:**
- `GET /api/triggers/{id}` (for edit)
- `POST /api/triggers` (for create)
- `PUT /api/triggers/{id}` (for update)
- `POST /api/triggers/{id}/test` (test trigger)
- `DELETE /api/triggers/{id}`

---

## Execution & My Tasks

### 13. My Tasks Page (`/my-tasks`)
**Route:** `/my-tasks`  
**Access:** Authenticated (All roles)  
**Layout:** Main Layout

#### Sections:
- **Header Section**
  - Page title: "My Tasks"
  - Refresh button
  - Filter dropdown (All, Pending, In Progress, Completed, Overdue)

- **Tasks List Section**
  - Task cards or table rows showing:
    - Task name
    - Task description
    - Assigned date
    - Due date (if applicable)
    - Status badge
    - Priority indicator
    - Associated flow (if any)
    - Actions (Start/Continue, View Details)

- **Empty State**
  - Message: "You have no pending tasks"
  - Illustration/icon

- **Pagination Section**

**API Endpoints:**
- `GET /api/executions/tasks/my-tasks` (with status filter)

---

### 14. Task Execution Page (`/my-tasks/:id`)
**Route:** `/my-tasks/:id`  
**Access:** Authenticated (All roles)  
**Layout:** Main Layout

#### Sections:
- **Header Section**
  - Task name
  - Status badge
  - Due date display
  - Back button

- **Task Information Section**
  - Task description
  - Associated flow information
  - Assigned by user
  - Created date

- **Task Form Section**
  - Dynamic form rendering based on task fields
  - All field types supported:
    - Text inputs
    - Number inputs
    - Date pickers
    - Dropdowns
    - Multi-selects
    - Checkboxes
    - File uploads
    - Image uploads
    - Rich text editors
    - Field groups
  - Field validation
  - Conditional field visibility

- **Action Buttons Section**
  - Save Draft button
  - Submit button
  - Cancel button
  - Request Help button

- **Submission History Section** (if resubmission allowed)
  - Previous submissions list
  - Submission dates
  - Status of each submission

**API Endpoints:**
- `GET /api/executions/tasks/{id}` (get task execution)
- `PUT /api/executions/tasks/{id}` (submit/update task execution)
- `POST /api/executions/tasks` (create new task execution)

---

### 15. Flow Instance Details Page (`/flows/instances/:id`)
**Route:** `/flows/instances/:id`  
**Access:** Authenticated (All roles)  
**Layout:** Main Layout

#### Sections:
- **Header Section**
  - Flow name
  - Instance status badge
  - Progress indicator
  - Back button

- **Flow Progress Visualization Section**
  - Visual flow diagram showing:
    - All levels
    - Current level highlighted
    - Completed levels marked
    - Pending levels grayed out
    - Branch paths shown

- **Current Level Section**
  - Level name
  - Level description
  - Assigned roles
  - Tasks in current level
  - Task completion status

- **Tasks List Section**
  - List of tasks in current level
  - Task status indicators
  - Links to task execution pages
  - Task completion checkmarks

- **Instance Information Section**
  - Started by user
  - Start date
  - Expected completion date
  - Current level
  - Completed levels count
  - Total levels count

- **Action Buttons Section**
  - Continue button (if tasks completed)
  - Pause button (if in progress)
  - Cancel button (if in progress)

**API Endpoints:**
- `GET /api/executions/flows/{id}` (get flow instance details)

---

## Custom Database

### 16. Database Tables List Page (`/database`)
**Route:** `/database`  
**Access:** Authenticated (DEVELOPER, ADMIN)  
**Layout:** Main Layout

#### Sections:
- **Header Section**
  - Page title: "Custom Database"
  - "Create New Table" button
  - Search bar

- **Tables Grid/List Section**
  - Table cards or rows showing:
    - Table name
    - Display name
    - Description
    - Number of fields
    - Number of records
    - Created date
    - Actions menu (View, Edit, Delete, Import CSV, Export CSV)

- **Empty State**
  - Message: "No custom tables created yet"
  - "Create Your First Table" button

**API Endpoints:**
- `GET /api/database` (list tables)

---

### 17. Table Builder Page (`/database/new` or `/database/:id/edit`)
**Route:** `/database/new` or `/database/:id/edit`  
**Access:** Authenticated (DEVELOPER, ADMIN)  
**Layout:** Main Layout

#### Sections:
- **Header Section**
  - Table name input
  - Save button
  - Back button

- **Left Sidebar - Table Configuration**
  - **Basic Information Section**
    - Name field (system name)
    - Display name field
    - Description textarea
  - **Table Settings Section**
    - Enable soft delete toggle
    - Enable audit logging toggle

- **Center Section - Fields Builder**
  - **Fields List Section**
    - List of fields with:
      - Field name
      - Field type
      - Required indicator
      - Unique indicator
      - Primary key indicator
      - Edit button
      - Delete button
    - "Add Field" button

- **Right Sidebar - Field Properties** (when field selected)
  - **Field Configuration Section**
    - Field name input
    - Field type selector:
      - Text
      - Number
      - Boolean
      - Date
      - DateTime
      - JSON
      - UUID
      - Foreign Key (relation)
    - Required checkbox
    - Unique checkbox
    - Default value input
    - Help text
  - **Relation Configuration** (if Foreign Key selected)
    - Related table selector
    - Relation type (One-to-One, One-to-Many, Many-to-Many)
    - Cascade delete options

- **Bottom Section - Relations**
  - **Relations List**
    - List of defined relations
    - Add relation button
    - Edit/Delete relation buttons

**API Endpoints:**
- `GET /api/database/{id}` (for edit)
- `POST /api/database` (for create)
- `PUT /api/database/{id}` (for update)
- `POST /api/database/{id}/fields` (add field)
- `PUT /api/database/{id}/fields/{fieldId}` (update field)
- `DELETE /api/database/{id}/fields/{fieldId}` (delete field)
- `POST /api/database/{id}/relations` (create relation)
- `DELETE /api/database/{id}/relations/{relationId}` (delete relation)

---

### 18. Table Data Page (`/database/:id/data`)
**Route:** `/database/:id/data`  
**Access:** Authenticated (All roles based on permissions)  
**Layout:** Main Layout

#### Sections:
- **Header Section**
  - Table display name
  - "Add Record" button
  - "Import CSV" button
  - "Export CSV" button
  - Back to tables button

- **Filters Section**
  - Search input
  - Field filters
  - Date range filters
  - Advanced filters button

- **Data Table Section**
  - Columns: All table fields
  - Sortable columns
  - Row actions (Edit, Delete, View)
  - Bulk actions (Select all, Delete selected)
  - Row selection checkboxes

- **Pagination Section**
  - Page numbers
  - Items per page selector
  - Total records count

- **Add/Edit Record Modal**
  - Form with all table fields
  - Validation
  - Save/Cancel buttons

**API Endpoints:**
- `GET /api/database/{id}/records` (with filters, pagination)
- `POST /api/database/{id}/records` (create record)
- `PUT /api/database/{id}/records/{recordId}` (update record)
- `DELETE /api/database/{id}/records/{recordId}` (delete record)
- `POST /api/database/{id}/import` (import CSV)
- `GET /api/database/{id}/export` (export CSV)

---

## Datasets & Reporting

### 19. Datasets List Page (`/datasets`)
**Route:** `/datasets`  
**Access:** Authenticated (DEVELOPER, ADMIN, MANAGER)  
**Layout:** Main Layout

#### Sections:
- **Header Section**
  - Page title: "Datasets"
  - "Create New Dataset" button
  - Search bar

- **Datasets Grid/List Section**
  - Dataset cards or rows showing:
    - Dataset name
    - Description
    - Number of sections
    - Last updated date
    - Created date
    - Actions menu (View, Edit, Delete, Duplicate)

- **Empty State**

**API Endpoints:**
- `GET /api/datasets` (list datasets)
- `DELETE /api/datasets/{id}`

---

### 20. Dataset Builder Page (`/datasets/new` or `/datasets/:id/edit`)
**Route:** `/datasets/new` or `/datasets/:id/edit`  
**Access:** Authenticated (DEVELOPER, ADMIN, MANAGER)  
**Layout:** Main Layout

#### Sections:
- **Header Section**
  - Dataset name input
  - Save button
  - Preview button
  - Back button

- **Left Sidebar - Dataset Configuration**
  - **Basic Information Section**
    - Name field
    - Description textarea
  - **Sections List**
    - List of sections
    - Add Section button
    - Section order controls

- **Center Section - Section Builder**
  - **Section Configuration Panel** (when section selected)
    - Section type selector:
      - Tasks Section
      - Data Table Section
      - Chart Section
      - Cards Section
      - Text Section
    - Section title
    - Section configuration based on type:
      - **Tasks Section:**
        - Task filter
        - Status filter
        - Display format (list/table)
      - **Data Table Section:**
        - Table selector
        - Column selection
        - Filters
        - Pagination settings
      - **Chart Section:**
        - Chart type (Bar, Line, Pie, Area)
        - Data source (table/query)
        - X-axis field
        - Y-axis field
        - Aggregation type
        - Chart title
      - **Cards Section:**
        - Card configuration
        - Data source
        - Card template
      - **Text Section:**
        - Rich text editor
        - HTML content

- **Right Sidebar - Preview**
  - Live preview of dataset
  - Section previews

**API Endpoints:**
- `GET /api/datasets/{id}` (for edit)
- `POST /api/datasets` (for create)
- `PUT /api/datasets/{id}` (for update)
- `POST /api/datasets/{id}/sections` (add section)
- `PUT /api/datasets/{id}/sections/{sectionId}` (update section)
- `DELETE /api/datasets/{id}/sections/{sectionId}` (delete section)
- `GET /api/datasets/{id}/data` (get dataset with data)

---

### 21. Dataset View Page (`/datasets/:id/view`)
**Route:** `/datasets/:id/view`  
**Access:** Authenticated (All roles)  
**Layout:** Main Layout

#### Sections:
- **Header Section**
  - Dataset name
  - Refresh button
  - Export button
  - Edit button (if user has permission)

- **Dataset Content Section**
  - Rendered sections:
    - Tasks list/table
    - Data tables
    - Charts
    - Cards
    - Text content
  - Real-time data
  - Interactive charts
  - Filterable tables

**API Endpoints:**
- `GET /api/datasets/{id}/data` (get dataset with populated data)

---

## Company Management

### 22. Company Hierarchy Page (`/company`)
**Route:** `/company`  
**Access:** Authenticated (ADMIN, MANAGER)  
**Layout:** Main Layout

#### Sections:
- **Header Section**
  - Page title: "Company Hierarchy"
  - "Add Department" button
  - "Add Role" button
  - View toggle (Tree/List)

- **Hierarchy Tree View Section**
  - Visual tree showing:
    - Company root
    - Departments (expandable)
    - Roles within departments
    - Users assigned to roles
  - Drag-and-drop for reorganization
  - Expand/collapse controls

- **List View Section** (alternative view)
  - Departments list
  - Roles list
  - Users list
  - Filters and search

- **Department/Role Details Panel** (when selected)
  - Name
  - Description
  - Parent department
  - Assigned users
  - Permissions
  - Edit/Delete buttons

**API Endpoints:**
- `GET /api/company/hierarchy` (get hierarchy tree)
- `POST /api/company/departments` (create department)
- `PUT /api/company/departments/{id}` (update department)
- `DELETE /api/company/departments/{id}` (delete department)
- `POST /api/company/roles` (create role)
- `PUT /api/company/roles/{id}` (update role)
- `DELETE /api/company/roles/{id}` (delete role)
- `GET /api/company/users` (get users)
- `PUT /api/company/departments/{id}/move` (move department)

---

### 23. Users Management Page (`/company/users`)
**Route:** `/company/users`  
**Access:** Authenticated (ADMIN)  
**Layout:** Main Layout

#### Sections:
- **Header Section**
  - Page title: "Users"
  - "Invite User" button
  - Search bar
  - Filter dropdowns (Department, Role, Status)

- **Users Table Section**
  - Columns:
    - Avatar
    - Name
    - Email
    - Role
    - Department
    - Status (Active/Inactive)
    - Last login
    - Actions menu (Edit, Deactivate, Delete, Reset Password)

- **Pagination Section**

- **Invite User Modal**
  - Email input
  - Role selector
  - Department selector
  - Send invitation button

**API Endpoints:**
- `GET /api/company/users` (list users)
- `POST /api/company/users/invite` (if implemented)
- `PUT /api/company/users/{id}` (update user)
- `DELETE /api/company/users/{id}` (delete user)

---

## Integrations

### 24. Integrations List Page (`/integrations`)
**Route:** `/integrations`  
**Access:** Authenticated (DEVELOPER, ADMIN)  
**Layout:** Main Layout

#### Sections:
- **Header Section**
  - Page title: "Integrations"
  - "Add Integration" button
  - Search bar

- **Integration Types Grid Section**
  - Integration type cards:
    - Gmail
    - Google Sheets
    - Outlook
    - Webhook
    - Custom API
  - Each card shows:
    - Integration name
    - Type icon
    - Status (Connected/Disconnected)
    - Last synced date
    - Actions menu (Configure, Test, Delete)

- **Empty State**

**API Endpoints:**
- `GET /api/integrations` (list integrations)
- `DELETE /api/integrations/{id}`

---

### 25. Integration Configuration Page (`/integrations/new` or `/integrations/:id/edit`)
**Route:** `/integrations/new` or `/integrations/:id/edit`  
**Access:** Authenticated (DEVELOPER, ADMIN)  
**Layout:** Main Layout

#### Sections:
- **Header Section**
  - Integration name
  - Save button
  - Test Connection button
  - Back button

- **Integration Type Selection** (for new)
  - Integration type selector
  - Type description
  - Setup instructions

- **Configuration Form Section**
  - **Gmail Integration:**
    - OAuth connection button
    - Account email display
    - Scope selection
  - **Google Sheets Integration:**
    - OAuth connection button
    - Spreadsheet selection
    - Sheet selection
  - **Outlook Integration:**
    - OAuth connection button
    - Account email display
  - **Webhook Integration:**
    - Webhook name
    - Webhook URL (generated)
    - Secret key
    - Allowed methods
    - Request format
  - **Custom API Integration:**
    - Base URL
    - Authentication type (API Key, Bearer Token, OAuth)
    - API Key/Token input
    - Headers configuration
    - Test endpoint

- **Settings Section**
  - Active toggle
  - Sync frequency
  - Error notification settings

**API Endpoints:**
- `GET /api/integrations/{id}` (for edit)
- `POST /api/integrations` (for create)
- `DELETE /api/integrations/{id}`

---

## Audit Logs

### 26. Audit Logs Page (`/audit`)
**Route:** `/audit`  
**Access:** Authenticated (ADMIN)  
**Layout:** Main Layout

#### Sections:
- **Header Section**
  - Page title: "Audit Logs"
  - "Export CSV" button
  - Refresh button

- **Filters Section**
  - Entity type filter
  - Entity ID filter
  - Action type filter
  - User filter
  - Date range picker
  - Clear filters button

- **Logs Table Section**
  - Columns:
    - Timestamp
    - User
    - Action (Create, Update, Delete, etc.)
    - Entity Type
    - Entity ID
    - Entity Name
    - Changes (diff view)
    - IP Address
  - Sortable columns
  - Expandable rows for details

- **Pagination Section**

- **Export Modal**
  - Export format selector (CSV, JSON)
  - Date range selector
  - Filter summary
  - Export button

**API Endpoints:**
- `GET /api/audit/logs` (with filters, pagination)
- `GET /api/audit/logs/export` (export CSV)

---

## Client Portal

### 27. Client Dashboard (`/client/dashboard`)
**Route:** `/client/dashboard`  
**Access:** Authenticated (Client role or external access)  
**Layout:** Client Layout (simplified, no sidebar)

#### Sections:
- **Header Section**
  - Welcome message
  - User name
  - Logout button

- **Statistics Cards Section**
  - Pending tasks count
  - Completed tasks count
  - Active flows count

- **Pending Tasks Section**
  - List of pending tasks
  - Task name
  - Due date
  - "Start Task" button

- **Active Flows Section**
  - List of active flow instances
  - Flow name
  - Current level
  - Progress indicator
  - "View Details" button

**API Endpoints:**
- `GET /api/client/dashboard` (get dashboard statistics)
- `GET /api/client/tasks` (get pending tasks)
- `GET /api/client/flows` (get active flows)

---

### 28. Client Task Page (`/client/tasks/:id`)
**Route:** `/client/tasks/:id`  
**Access:** Authenticated (Client role)  
**Layout:** Client Layout

#### Sections:
- **Header Section**
  - Task name
  - Back button

- **Task Form Section**
  - Simplified form view
  - All task fields
  - Submit button
  - Save draft button

**API Endpoints:**
- `GET /api/client/tasks/{id}` (get task)
- `PUT /api/client/tasks/{id}` (submit task)

---

### 29. Client Flow Tracking Page (`/client/flows/:id`)
**Route:** `/client/flows/:id`  
**Access:** Authenticated (Client role)  
**Layout:** Client Layout

#### Sections:
- **Header Section**
  - Flow name
  - Back button

- **Flow Progress Section**
  - Visual progress indicator
  - Current level display
  - Completed levels
  - Pending levels

- **Tasks Section**
  - List of tasks in current level
  - Task completion status
  - Links to task pages

**API Endpoints:**
- `GET /api/client/flows/{id}` (get flow instance)

---

## Settings

### 30. Settings Page (`/settings`)
**Route:** `/settings`  
**Access:** Authenticated (All roles)  
**Layout:** Main Layout

#### Sections:
- **Header Section**
  - Page title: "Settings"
  - Tabs navigation:
    - Profile
    - Account
    - Notifications
    - Security
    - Preferences
    - Billing (if applicable)

- **Profile Tab**
  - Avatar upload
  - First Name input
  - Last Name input
  - Email display (read-only)
  - Phone number input
  - Bio textarea
  - Save button

- **Account Tab**
  - Company information (if admin)
  - Role display
  - Department display
  - Account status

- **Notifications Tab**
  - Email notifications toggle
  - Task assignment notifications
  - Flow completion notifications
  - Daily digest toggle
  - Notification preferences

- **Security Tab**
  - Change password form
  - Two-factor authentication toggle
  - Active sessions list
  - Logout from all devices button

- **Preferences Tab**
  - Theme selector (Light/Dark/System)
  - Language selector
  - Date format selector
  - Time zone selector
  - Default view preferences

- **Billing Tab** (if applicable)
  - Subscription plan display
  - Usage statistics
  - Payment method
  - Billing history

**API Endpoints:**
- `GET /api/auth/me` (get user info)
- `PUT /api/auth/me` (update user info)
- `POST /api/auth/change-password` (if implemented)

---

## Additional Pages

### 31. Search Page (`/search`)
**Route:** `/search`  
**Access:** Authenticated (All roles)  
**Layout:** Main Layout

#### Sections:
- **Header Section**
  - Search input (prominent)
  - Search filters (All, Tasks, Flows, Tables, Datasets)

- **Search Results Section**
  - Grouped results by type
  - Result cards with:
    - Title
    - Type badge
    - Description snippet
    - Link to item
  - "No results" state

---

### 32. Help & Documentation Page (`/help`)
**Route:** `/help`  
**Access:** Authenticated (All roles)  
**Layout:** Main Layout

#### Sections:
- **Header Section**
  - Page title: "Help & Documentation"
  - Search documentation input

- **Documentation Sections**
  - Getting Started guide
  - Task Builder guide
  - Flow Builder guide
  - Database Builder guide
  - API Documentation link
  - Video tutorials
  - FAQ section
  - Contact support

---

## Summary

### Total Pages: 32

**Public Pages (3):**
1. Login
2. Register
3. Forgot Password

**Developer/Admin Pages (19):**
4. Dashboard
5. Tasks List
6. Task Builder
7. Task Preview
8. Flows List
9. Flow Builder
10. Flow Instances
11. Triggers List
12. Trigger Builder
13. Database Tables List
14. Table Builder
15. Table Data
16. Datasets List
17. Dataset Builder
18. Dataset View
19. Company Hierarchy
20. Users Management
21. Integrations List
22. Integration Configuration
23. Audit Logs

**All Users Pages (6):**
24. My Tasks
25. Task Execution
26. Flow Instance Details
27. Settings
28. Search
29. Help

**Client Portal Pages (3):**
30. Client Dashboard
31. Client Task Page
32. Client Flow Tracking

---

## Navigation Structure

### Main Sidebar Navigation:
- Dashboard
- Tasks
- Flows
- My Tasks
- Database
- Datasets
- Company
- Integrations
- Triggers
- Audit Logs
- Settings
- Help
- Search

### User Menu (Dropdown):
- Profile
- Settings
- Logout

---

## Layout Types

1. **Auth Layout** - Centered, no sidebar (Login, Register, Forgot Password)
2. **Main Layout** - Sidebar + Header (Most pages)
3. **Client Layout** - Simplified, minimal sidebar (Client portal pages)

---

## Common Components Needed

### Shared UI Components:
- DataTable (with sorting, filtering, pagination)
- Form Builder (drag-and-drop)
- Flow Diagram/Visualizer
- Chart Components (Bar, Line, Pie, Area)
- File Upload Component
- Rich Text Editor
- Date/Time Pickers
- Modal/Dialog Components
- Toast Notifications
- Loading Spinners
- Empty States
- Error States
- Confirmation Dialogs
- Breadcrumb Navigation
- Search Bar
- Filter Panels
- Export Buttons

---

## Notes

- All pages should have proper error handling and loading states
- All forms should have validation
- All data tables should support sorting, filtering, and pagination
- All pages should be responsive (mobile-friendly)
- All pages should follow accessibility best practices
- All API calls should have proper error handling
- All pages should support dark mode (if theme toggle is implemented)

