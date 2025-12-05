# Frontend UI Codebase - Comprehensive Analysis

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Core Execution Flows](#core-execution-flows)
5. [State Management](#state-management)
6. [API Integration](#api-integration)
7. [Routing & Navigation](#routing--navigation)
8. [Component Architecture](#component-architecture)
9. [Form Handling](#form-handling)
10. [UI Components](#ui-components)
11. [Feature Modules](#feature-modules)
12. [Client Portal](#client-portal)
13. [Error Handling](#error-handling)
14. [Authentication Flow](#authentication-flow)

---

## Architecture Overview

### High-Level Architecture
- **Framework**: React 19.x with TypeScript 5.x
- **Build Tool**: Vite 7.x
- **Architecture Pattern**: Feature-based modular architecture
- **State Management**: Zustand (global state) + React hooks (local state)
- **Routing**: React Router v7 with protected routes
- **Styling**: Tailwind CSS 4.x with Radix UI components

### Key Design Principles
1. **Feature-Based Organization**: Each feature is self-contained with its own components, services, stores, and types
2. **Separation of Concerns**: Clear separation between UI components, business logic (stores), and API calls (services)
3. **Type Safety**: Full TypeScript coverage with strict typing
4. **Reusability**: Shared UI components and utilities
5. **Error Boundaries**: React ErrorBoundary for graceful error handling

---

## Tech Stack

### Core Dependencies
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-router-dom": "^7.9.6",
  "zustand": "^5.0.8",
  "axios": "^1.13.2",
  "react-hook-form": "^7.66.1",
  "zod": "^4.1.13",
  "@dnd-kit/core": "^6.3.1",
  "@dnd-kit/sortable": "^10.0.0",
  "recharts": "^3.5.1"
}
```

### UI Libraries
- **Radix UI**: Headless UI components (Dialog, Dropdown, Select, Tabs, etc.)
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Recharts**: Chart library for data visualization

### Development Tools
- **Vite**: Fast build tool and dev server
- **TypeScript**: Type safety
- **Vitest**: Unit testing
- **Playwright**: E2E testing
- **ESLint**: Code linting

---

## Project Structure

```
frontend/src/
├── main.tsx                 # Application entry point
├── App.tsx                  # Root component with routing
├── index.css                # Global styles
│
├── layouts/                 # Layout components
│   ├── MainLayout.tsx       # Developer layout (sidebar + header)
│   ├── ClientLayout.tsx    # Client portal layout (simplified)
│   └── AuthLayout.tsx       # Authentication pages layout
│
├── features/                # Feature modules (self-contained)
│   ├── auth/                # Authentication
│   │   ├── components/      # LoginForm, RegisterForm, ProtectedRoute
│   │   ├── services/         # auth.service.ts (API calls)
│   │   ├── store/            # authStore.ts (Zustand store)
│   │   └── types/           # auth.types.ts
│   │
│   ├── task-builder/         # Task Builder feature
│   │   ├── components/       # TaskBuilder, FormCanvas, FieldPalette, etc.
│   │   ├── services/         # task.service.ts
│   │   ├── store/            # taskBuilderStore.ts
│   │   └── types/            # task.types.ts
│   │
│   ├── flow-builder/         # Flow Builder feature
│   ├── client-portal/         # Client-facing features
│   ├── database-builder/      # Database builder
│   ├── dataset-builder/       # Dataset builder
│   ├── trigger-builder/       # Trigger builder
│   ├── integrations/          # Integrations management
│   ├── company/               # Company hierarchy
│   ├── audit-logs/            # Audit logs
│   └── dashboard/             # Main dashboard
│
├── components/              # Shared components
│   ├── ui/                   # Radix UI components (button, input, card, etc.)
│   ├── shared/               # ErrorBoundary, LoadingSpinner, EmptyState
│   ├── app-sidebar.tsx       # Main navigation sidebar
│   └── search-form.tsx       # Global search
│
├── lib/                      # Utilities
│   ├── utils.ts              # cn() helper for Tailwind classes
│   └── design-tokens.ts      # Design system tokens
│
└── hooks/                    # Custom React hooks
    └── use-mobile.ts          # Mobile detection hook
```

---

## Core Execution Flows

### 1. Application Initialization Flow

```
main.tsx
  └─> App.tsx (BrowserRouter)
      └─> Routes
          ├─> Public Routes (AuthLayout)
          │   ├─> /login → LoginForm
          │   └─> /register → RegisterForm
          │
          ├─> Protected Developer Routes (MainLayout)
          │   ├─> /dashboard → MainDashboard
          │   ├─> /tasks → TaskList / TaskBuilder
          │   ├─> /flows → FlowList / FlowBuilder
          │   └─> ... (other developer routes)
          │
          └─> Protected Client Routes (ClientLayout)
              ├─> /client/dashboard → ClientDashboard
              └─> /client/tasks/:id/complete → TaskCompletion
```

### 2. Authentication Flow

```
User visits /login
  └─> LoginForm component renders
      └─> User submits credentials
          └─> authService.login(email, password)
              └─> POST /api/auth/login
                  ├─> Success: Store token + user in authStore
                  │   └─> Navigate to /dashboard
                  └─> Error: Show toast notification
```

**Key Files:**
- `features/auth/components/LoginForm.tsx`
- `features/auth/services/auth.service.ts`
- `features/auth/store/authStore.ts`

**Token Management:**
- Token stored in `localStorage` and Zustand store
- Axios interceptor adds token to all requests: `Authorization: Bearer <token>`
- 401 errors trigger automatic logout and redirect to `/login`

### 3. Task Builder Execution Flow

```
User navigates to /tasks/new or /tasks/:id
  └─> TaskBuilder component mounts
      ├─> If new task: Create task via API → Navigate to /tasks/:id
      └─> If existing task: Load task via API
          └─> Store task in taskBuilderStore
              └─> Render three-panel layout:
                  ├─> Left: TaskSidebar (task list)
                  ├─> Center: FormCanvas (drag-and-drop fields)
                  └─> Right: FieldPropertiesPanel (field configuration)
```

**Save Flow:**
```
User clicks Save
  └─> handleSave() in TaskBuilder
      ├─> Save new fields (temp- IDs) → Get real IDs
      ├─> Reorder fields if needed
      ├─> Update task metadata if changed
      └─> Reload task from API
          └─> Update store → Clear unsaved changes flag
```

**Key Components:**
- `TaskBuilder.tsx`: Main orchestrator
- `FormCanvas.tsx`: Drag-and-drop field canvas
- `FieldPalette.tsx`: Available field types
- `FieldPropertiesPanel.tsx`: Field configuration UI
- `TaskPreview.tsx`: Read-only preview mode

**State Management:**
- `taskBuilderStore`: Manages current task, selected field, unsaved changes
- Temporary fields use `temp-${timestamp}` IDs until saved
- Drag-and-drop handled by `@dnd-kit`

### 4. Flow Builder Execution Flow

```
User navigates to /flows/new or /flows/:id
  └─> FlowBuilder component mounts
      ├─> If new flow: Create flow via API → Navigate to /flows/:id
      └─> If existing flow: Load flow via API
          └─> Store flow in flowBuilderStore
              └─> Render three-panel layout:
                  ├─> Left: FlowSidebar (flow list)
                  ├─> Center: FlowCanvas (draggable levels)
                  └─> Right: LevelPropertiesPanel / BranchingRules
```

**Save Flow (Complex):**
```
User clicks Save
  └─> handleSave() in FlowBuilder
      ├─> Save new levels (temp- IDs) → Get real IDs
      ├─> CRITICAL: Reorder ALL levels to match visual order
      │   └─> Build orderedLevelIds array preserving visual order
      │       └─> Call flowService.reorderLevels()
      ├─> Update level properties (name, description, config)
      ├─> Update flow metadata
      └─> Reload flow → Verify order matches
```

**Key Features:**
- Drag-and-drop level reordering
- Level properties (tasks, roles, config)
- Branching rules (conditions for flow progression)
- Test mode (preview execution path)
- Publish flow (makes it read-only)

**State Management:**
- `flowBuilderStore`: Manages current flow, selected level/branch, unsaved changes
- Complex reordering logic to preserve visual order after save

### 5. Client Portal Execution Flow

```
Client user logs in → Navigate to /client/dashboard
  └─> ClientDashboard component
      ├─> Load dashboard stats (pending, urgent, completed)
      ├─> Load pending tasks
      └─> Display:
          ├─> Stats cards
          ├─> Pending tasks list
          └─> Active workflows
```

**Task Completion Flow:**
```
Client clicks on pending task
  └─> Navigate to /client/tasks/:id/complete
      └─> TaskCompletion component
          ├─> Load task execution details
          ├─> Display submitted data (read-only)
          ├─> Render dynamic form based on task fields
          └─> User submits response
              └─> POST /api/client/tasks/:id/complete
                  └─> Success → Refresh pending tasks → Navigate back
```

**Key Components:**
- `ClientDashboard.tsx`: Main client dashboard
- `TaskCompletion.tsx`: Task completion form
- `PendingTasks.tsx`: List of pending tasks
- `FlowTracking.tsx`: Track flow instance progress

---

## State Management

### Zustand Stores

#### 1. Auth Store (`authStore.ts`)
```typescript
{
  user: IUser | null,
  token: string | null,
  isAuthenticated: boolean,
  setAuth: (user, token) => void,
  clearAuth: () => void,
  setUser: (user) => void
}
```
- **Persistence**: Uses `persist` middleware (localStorage)
- **Usage**: Global authentication state

#### 2. Task Builder Store (`taskBuilderStore.ts`)
```typescript
{
  currentTask: ITask | null,
  selectedField: ITaskField | null,
  hasUnsavedChanges: boolean,
  isPreviewMode: boolean,
  draggedField: ITaskField | null,
  addField: (field) => void,
  updateField: (fieldId, updates) => void,
  deleteField: (fieldId) => void,
  reorderFields: (fieldIds) => void
}
```
- **Scope**: Task Builder feature only
- **Purpose**: Manages task editing state

#### 3. Flow Builder Store (`flowBuilderStore.ts`)
```typescript
{
  currentFlow: IFlow | null,
  selectedLevel: IFlowLevel | null,
  selectedBranch: IFlowBranch | null,
  hasUnsavedChanges: boolean,
  draggedLevel: IFlowLevel | null,
  addLevel: (level) => void,
  updateLevel: (levelId, updates) => void,
  deleteLevel: (levelId) => void,
  reorderLevels: (levelIds) => void,
  // ... branch and trigger management
}
```
- **Scope**: Flow Builder feature only
- **Purpose**: Manages flow editing state

#### 4. Client Store (`clientStore.ts`)
```typescript
{
  stats: IClientDashboardStats | null,
  pendingTasks: IClientTask[],
  isLoading: boolean,
  error: string | null,
  loadDashboard: () => Promise<void>,
  loadPendingTasks: () => Promise<void>
}
```
- **Scope**: Client Portal feature
- **Purpose**: Manages client-side data

### State Management Patterns

1. **Feature Stores**: Each major feature has its own Zustand store
2. **Local State**: Component-specific state uses `useState`
3. **Form State**: React Hook Form manages form state
4. **Server State**: Fetched via services, cached in stores

---

## API Integration

### Axios Configuration

**Base Configuration** (`auth.service.ts`):
```typescript
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
```

**Request Interceptor**:
```typescript
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Response Interceptor**:
```typescript
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Auto-logout on 401
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Service Layer Pattern

Each feature has a service class that encapsulates API calls:

```typescript
class TaskService {
  async createTask(data: ICreateTaskRequest): Promise<ITask> {
    const response = await axios.post<{ success: true; data: ITask }>('/tasks', data);
    return response.data.data;
  }
  
  async getTask(id: string): Promise<ITask> {
    const response = await axios.get<{ success: true; data: ITask }>(`/tasks/${id}`);
    return response.data.data;
  }
  
  // ... more methods
}

export const taskService = new TaskService();
```

### API Response Format

All API responses follow this format:
```typescript
{
  success: boolean,
  data: T,  // Actual data
  message?: string  // Optional message
}
```

Error responses:
```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

---

## Routing & Navigation

### Route Structure

**Public Routes** (`/login`, `/register`):
- No authentication required
- Wrapped in `AuthLayout`

**Protected Developer Routes**:
- Require authentication (checked by `ProtectedRoute`)
- Wrapped in `MainLayout` (sidebar + header)
- Routes:
  - `/dashboard` - Main dashboard
  - `/tasks` - Task list
  - `/tasks/new` - Create new task
  - `/tasks/:id` - Edit task
  - `/flows` - Flow list
  - `/flows/new` - Create new flow
  - `/flows/:id` - Edit flow
  - `/triggers` - Trigger list
  - `/database` - Database builder
  - `/datasets` - Dataset builder
  - `/company` - Company hierarchy
  - `/integrations` - Integrations
  - `/audit-logs` - Audit logs
  - `/users` - User management

**Protected Client Routes** (`/client/*`):
- Require authentication
- Wrapped in `ClientLayout` (simplified navigation)
- Routes:
  - `/client/dashboard` - Client dashboard
  - `/client/tasks` - My tasks
  - `/client/tasks/:id/complete` - Complete task
  - `/client/flows` - My flows
  - `/client/flows/:id` - Track flow

### Protected Route Implementation

```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}
```

### Navigation Components

**MainLayout Sidebar**:
- Collapsible sidebar with navigation groups
- Groups: Platform, Data, Administration
- User menu dropdown
- Search bar in header

**ClientLayout**:
- Simple top navigation bar
- Three main links: Dashboard, My Tasks, My Flows
- User menu dropdown

---

## Component Architecture

### Component Types

1. **Page Components**: Top-level route components (TaskBuilder, FlowBuilder, etc.)
2. **Feature Components**: Feature-specific UI (FormCanvas, FlowCanvas, etc.)
3. **Shared Components**: Reusable across features (Button, Input, Card, etc.)
4. **Layout Components**: Page structure (MainLayout, ClientLayout)

### Component Patterns

**Container/Presenter Pattern**:
- Container components handle logic and state
- Presenter components handle UI rendering

**Example: TaskBuilder**
```typescript
// Container: TaskBuilder.tsx
export function TaskBuilder() {
  const { currentTask, setCurrentTask } = useTaskBuilderStore();
  // ... logic
  
  return (
    <div>
      <TaskSidebar />  {/* Presenter */}
      <FormCanvas />   {/* Presenter */}
      <FieldPropertiesPanel />  {/* Presenter */}
    </div>
  );
}
```

### Drag-and-Drop Implementation

**Task Builder** (`FormCanvas.tsx`):
- Uses `@dnd-kit/core` and `@dnd-kit/sortable`
- Fields can be reordered by dragging
- Visual feedback during drag

**Flow Builder** (`FlowCanvas.tsx`):
- Levels can be reordered by dragging
- Complex reordering logic to preserve order after save

---

## Form Handling

### React Hook Form + Zod

**Pattern**:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const form = useForm({
  resolver: zodResolver(schema),
});
```

**Example: LoginForm**
- Uses React Hook Form for form state
- Zod for validation
- Manual submission handling (not using form.handleSubmit)

**Dynamic Forms** (TaskCompletion):
- Forms are generated dynamically based on task fields
- Each field type has its own input component
- Validation based on field configuration

---

## UI Components

### Radix UI Components

All UI components are built on Radix UI primitives:
- `Button` - Styled button component
- `Input` - Text input
- `Card` - Container card
- `Dialog` - Modal dialogs
- `DropdownMenu` - Dropdown menus
- `Select` - Select dropdowns
- `Tabs` - Tab navigation
- `Checkbox` - Checkbox input
- `Avatar` - User avatar
- `Badge` - Status badges
- `Tooltip` - Tooltips
- `ScrollArea` - Scrollable containers

### Styling Approach

**Tailwind CSS**:
- Utility-first CSS
- Custom theme colors defined in `tailwind.config.js`
- Dark theme by default (`background: #0F1419`, `card: #1A1F2E`)
- Primary color: `#3B82F6` (blue)

**Class Merging**:
```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  className  // Allow prop overrides
)} />
```

---

## Feature Modules

### 1. Task Builder

**Purpose**: Create and edit dynamic task forms

**Key Features**:
- Drag-and-drop field ordering
- Field types: text, number, date, dropdown, multi-select, checkbox, file, image, rich-text, field-group
- Field validation rules
- Conditional logic (show/hide fields based on conditions)
- Preview mode
- Publish task (makes it read-only)

**Components**:
- `TaskBuilder.tsx` - Main container
- `TaskList.tsx` - List of all tasks
- `TaskSidebar.tsx` - Task switcher sidebar
- `FormCanvas.tsx` - Drag-and-drop canvas
- `FieldPalette.tsx` - Available field types
- `FieldPropertiesPanel.tsx` - Field configuration
- `TaskPreview.tsx` - Read-only preview

### 2. Flow Builder

**Purpose**: Create multi-level workflows

**Key Features**:
- Multi-level flow structure
- Level properties (tasks, roles, config)
- Branching rules (conditional flow progression)
- Drag-and-drop level reordering
- Test mode (preview execution)
- Publish flow

**Components**:
- `FlowBuilder.tsx` - Main container
- `FlowList.tsx` - List of all flows
- `FlowSidebar.tsx` - Flow switcher
- `FlowCanvas.tsx` - Draggable levels canvas
- `FlowLevel.tsx` - Individual level card
- `LevelPropertiesPanel.tsx` - Level configuration
- `BranchingRules.tsx` - Branching conditions editor

### 3. Client Portal

**Purpose**: Simplified interface for end users

**Key Features**:
- Dashboard with stats
- Pending tasks list
- Task completion form
- Flow instance tracking

**Components**:
- `ClientDashboard.tsx` - Main dashboard
- `PendingTasks.tsx` - Task list
- `TaskCompletion.tsx` - Task completion form
- `FlowTracking.tsx` - Flow progress tracker

### 4. Database Builder

**Purpose**: Create custom database tables

**Key Features**:
- Table designer
- Field editor
- Relations manager
- Data table view
- Record manager (CRUD)
- Import/Export (CSV)

### 5. Dataset Builder

**Purpose**: Create custom dashboards

**Key Features**:
- Multiple section types: Tasks, Data Table, Chart, Cards, Text
- Section editor
- Dataset preview

### 6. Trigger Builder

**Purpose**: Create event-based automation

**Key Features**:
- Condition builder
- Action builder (email, flow, database, webhook, task)
- Trigger list

### 7. Integrations

**Purpose**: Connect external services

**Supported Integrations**:
- Gmail
- Google Sheets
- Outlook
- Webhook
- Custom API

### 8. Company Hierarchy

**Purpose**: Manage organizational structure

**Features**:
- Department tree
- Role manager
- User assignment

### 9. Audit Logs

**Purpose**: Track system activity

**Features**:
- Log table with filters
- Log details view
- Export functionality

---

## Client Portal

### Purpose
Simplified interface for end users (non-developers) to:
- View assigned tasks
- Complete tasks
- Track workflow progress

### Key Differences from Developer Portal

1. **Simplified Navigation**: Top bar instead of sidebar
2. **Limited Features**: Only task completion and flow tracking
3. **Read-Only Views**: Cannot edit tasks/flows
4. **Focused UI**: Less clutter, more focused on task completion

### Routes
- `/client/dashboard` - Overview with stats
- `/client/tasks` - List of pending tasks
- `/client/tasks/:id/complete` - Complete a task
- `/client/flows` - List of active flows
- `/client/flows/:id` - Track flow progress

---

## Error Handling

### Error Boundaries

**React ErrorBoundary** (`components/shared/ErrorBoundary.tsx`):
- Catches React component errors
- Displays fallback UI
- Wraps entire app in `App.tsx`

### API Error Handling

**Axios Interceptor**:
- 401 errors → Auto-logout and redirect
- Other errors → Propagate to component

**Component-Level Error Handling**:
```typescript
try {
  const result = await service.method();
  // Handle success
} catch (error: any) {
  const errorMessage = error?.response?.data?.error?.message || error?.message;
  showToast({
    title: 'Error',
    description: errorMessage,
    status: 'error',
  });
}
```

### Error Display

**Toast Notifications**:
- Success: Green toast
- Error: Red toast
- Warning: Yellow toast
- Info: Blue toast

**Error States**:
- Loading states: Spinner components
- Empty states: `EmptyState` component
- Error states: Error messages in UI

---

## Authentication Flow

### Login Flow

```
1. User visits /login
2. LoginForm renders
3. User enters credentials
4. Submit → authService.login(email, password)
5. POST /api/auth/login
6. Success → Store token + user in authStore
7. Navigate to /dashboard
```

### Token Management

**Storage**:
- Token stored in `localStorage` (key: `token`)
- User data stored in Zustand store (persisted to localStorage)

**Request Headers**:
- Axios interceptor adds: `Authorization: Bearer <token>`

**Token Expiration**:
- 401 response → Auto-logout → Redirect to `/login`

### Protected Routes

**Implementation**:
```typescript
<Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
  {/* Protected routes */}
</Route>
```

**ProtectedRoute Component**:
- Checks for token in authStore
- Redirects to `/login` if no token
- Renders children if authenticated

---

## Key Integration Points

### Frontend ↔ Backend Communication

1. **API Base URL**: `VITE_API_URL` env variable (default: `http://localhost:3000/api`)
2. **Authentication**: JWT token in `Authorization` header
3. **Request Format**: JSON body for POST/PUT requests
4. **Response Format**: `{ success: boolean, data: T }`

### Environment Variables

```env
VITE_API_URL=http://localhost:3000/api
```

### Build & Development

**Development**:
```bash
npm run dev  # Starts Vite dev server (port 5173)
```

**Build**:
```bash
npm run build  # Builds for production
```

**Preview**:
```bash
npm run preview  # Preview production build
```

---

## Testing

### Unit Tests
- **Framework**: Vitest
- **Location**: `tests/features/`
- **Pattern**: Component tests with React Testing Library

### E2E Tests
- **Framework**: Playwright
- **Location**: `tests/e2e/`
- **Tests**: `auth.spec.ts`, `task-builder.spec.ts`, `flow-builder.spec.ts`, `full-workflow.spec.ts`

---

## Summary

### Architecture Highlights

1. **Modular**: Feature-based organization
2. **Type-Safe**: Full TypeScript coverage
3. **State Management**: Zustand for global state, React hooks for local state
4. **API Integration**: Axios with interceptors for auth and error handling
5. **UI Components**: Radix UI + Tailwind CSS
6. **Routing**: React Router v7 with protected routes
7. **Forms**: React Hook Form + Zod validation

### Key Execution Flows

1. **Authentication**: Login → Store token → Protected routes
2. **Task Builder**: Create/Edit → Drag fields → Configure → Save → Publish
3. **Flow Builder**: Create/Edit → Add levels → Configure → Save → Publish
4. **Client Portal**: View tasks → Complete task → Track flows

### Integration Points

- **Backend API**: RESTful API at `/api/*`
- **Authentication**: JWT tokens
- **Real-time**: Not implemented (future: WebSockets for live updates)
- **File Uploads**: Multer on backend (handled via form submissions)

---

## Next Steps for UI Development

1. **Real-time Updates**: WebSocket integration for live task/flow updates
2. **Offline Support**: Service workers for offline functionality
3. **Performance**: Code splitting, lazy loading
4. **Accessibility**: ARIA labels, keyboard navigation
5. **Internationalization**: i18n support for multiple languages

---

*Last Updated: 2024-12-04*

