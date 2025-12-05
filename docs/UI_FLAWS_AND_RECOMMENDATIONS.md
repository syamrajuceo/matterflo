# UI Codebase Flaws & Recommendations for Fresh Implementation

## 🔴 Critical Flaws & Bad Practices

### 1. **Excessive Console Logging (158 instances!)**

**Problem:**
- `console.log`, `console.error`, `console.warn` scattered throughout production code
- Debug statements left in production builds
- No centralized logging strategy
- Performance impact from logging in production

**Examples:**
```typescript
// FlowBuilder.tsx - 76 console.log statements!
console.log('Saving flow - current levels order:', ...);
console.log('✅ Order verified - matches expected order');
console.error('❌ CRITICAL: Order mismatch in final reload!');
```

**Impact:**
- Performance degradation
- Security risk (exposing internal state)
- Cluttered browser console
- No production error tracking

**Recommendation:**
```typescript
// Create a logging utility
// lib/logger.ts
const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => isDev && console.log(...args),
  error: (...args: any[]) => console.error(...args), // Always log errors
  warn: (...args: any[]) => isDev && console.warn(...args),
  // Integrate with error tracking service (Sentry, etc.)
};
```

---

### 2. **Missing Performance Optimizations**

**Problems:**

#### a) No Memoization
```typescript
// FlowBuilder.tsx - Re-renders on every state change
const sortedLevels = currentFlow
  ? [...(currentFlow.levels || [])].sort((a, b) => a.order - b.order)
  : [];
// Should be: useMemo(() => ..., [currentFlow?.levels])
```

#### b) Missing React.memo
- Components re-render unnecessarily
- No memoization of expensive computations
- Event handlers recreated on every render

#### c) No Code Splitting
- All routes loaded upfront
- Large bundle size
- Slow initial load

**Recommendation:**
```typescript
// Use React.lazy for code splitting
const TaskBuilder = lazy(() => import('./features/task-builder/components/TaskBuilder'));
const FlowBuilder = lazy(() => import('./features/flow-builder/components/FlowBuilder'));

// Wrap in Suspense
<Suspense fallback={<LoadingSpinner />}>
  <TaskBuilder />
</Suspense>

// Memoize expensive computations
const sortedLevels = useMemo(
  () => currentFlow?.levels.sort((a, b) => a.order - b.order) ?? [],
  [currentFlow?.levels]
);

// Memoize callbacks
const handleSave = useCallback(async () => {
  // ...
}, [currentFlow]);
```

---

### 3. **Poor Error Handling**

**Problems:**

#### a) Inconsistent Error Handling
```typescript
// Some places catch and show toast
try {
  await service.method();
} catch (error: any) {
  showToast({ title: 'Error', ... });
}

// Other places just console.error
catch (error) {
  console.error('Failed:', error);
  // No user feedback!
}
```

#### b) No Global Error Boundary Strategy
- Only one ErrorBoundary wrapping entire app
- No granular error boundaries per feature
- Errors in one feature crash entire app

#### c) No Error Recovery Mechanisms
- No retry logic for failed API calls
- No offline error handling
- No error state management

**Recommendation:**
```typescript
// Create error handling hook
// hooks/useErrorHandler.ts
export function useErrorHandler() {
  const { showToast } = useToast();
  
  return useCallback((error: unknown, context?: string) => {
    const message = extractErrorMessage(error);
    logger.error(`Error in ${context}:`, error);
    
    // Show user-friendly message
    showToast({
      title: 'Something went wrong',
      description: message,
      status: 'error',
    });
    
    // Send to error tracking service
    if (errorTracking) {
      errorTracking.captureException(error, { context });
    }
  }, []);
}

// Use in components
const handleError = useErrorHandler();
try {
  await service.method();
} catch (error) {
  handleError(error, 'TaskBuilder.save');
}
```

---

### 4. **State Management Anti-Patterns**

**Problems:**

#### a) Duplicate State Storage
```typescript
// Token stored in both localStorage AND Zustand store
localStorage.setItem('token', token);  // In authStore
set({ token, ... });  // Also in Zustand
```

#### b) Direct Store Access Outside Components
```typescript
// FlowBuilder.tsx - Accessing store outside React
const latestFlow = flowBuilderStore.getState().currentFlow;
// Should use hook: const { currentFlow } = useFlowBuilderStore();
```

#### c) No Optimistic Updates
- UI doesn't update immediately on user actions
- Users see loading states even for instant operations
- Poor perceived performance

#### d) Complex Save Logic
- FlowBuilder save function is 400+ lines!
- Too many responsibilities in one function
- Hard to test and maintain

**Recommendation:**
```typescript
// Separate concerns - use custom hooks
// hooks/useFlowSave.ts
export function useFlowSave() {
  const { currentFlow } = useFlowBuilderStore();
  const handleError = useErrorHandler();
  
  const saveLevels = useCallback(async (levels: IFlowLevel[]) => {
    // Handle temp levels
    // Handle reordering
    // Handle updates
  }, []);
  
  const saveFlow = useCallback(async () => {
    try {
      await saveLevels(currentFlow.levels);
      await updateFlowMetadata(currentFlow);
      // Optimistic update
      setCurrentFlow({ ...currentFlow, status: 'saved' });
    } catch (error) {
      handleError(error, 'FlowSave');
      // Revert optimistic update
    }
  }, [currentFlow]);
  
  return { saveFlow };
}
```

---

### 5. **API Integration Issues**

**Problems:**

#### a) No Request Cancellation
```typescript
// If component unmounts, request continues
useEffect(() => {
  fetchData(); // No cleanup!
}, []);
```

#### b) No Request Deduplication
- Multiple components can trigger same API call
- Wasted network requests
- Race conditions

#### c) No Caching Strategy
- Every navigation refetches data
- No stale-while-revalidate pattern
- No cache invalidation

#### d) Polling Without Cleanup
```typescript
// AuditLogs.tsx - Polling every 30 seconds
useEffect(() => {
  pollIntervalRef.current = setInterval(() => {
    fetchLogs();
  }, 30000);
  // Cleanup exists, but could be better
}, [filters]);
```

**Recommendation:**
```typescript
// Use React Query or SWR for data fetching
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Automatic caching, deduplication, refetching
const { data, isLoading, error } = useQuery({
  queryKey: ['tasks', taskId],
  queryFn: () => taskService.getTask(taskId),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});

// Mutations with optimistic updates
const mutation = useMutation({
  mutationFn: taskService.updateTask,
  onMutate: async (newTask) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['tasks', newTask.id]);
    // Snapshot previous value
    const previous = queryClient.getQueryData(['tasks', newTask.id]);
    // Optimistically update
    queryClient.setQueryData(['tasks', newTask.id], newTask);
    return { previous };
  },
  onError: (err, newTask, context) => {
    // Rollback on error
    queryClient.setQueryData(['tasks', newTask.id], context.previous);
  },
});
```

---

### 6. **Type Safety Issues**

**Problems:**

#### a) Excessive `any` Types
```typescript
catch (error: any) {  // Should be unknown
  const errorMessage = error?.response?.data?.error?.message;
}
```

#### b) Type Assertions Without Validation
```typescript
const newField: ITaskField = {
  type: type as any,  // Unsafe type assertion
  // ...
};
```

#### c) Missing Type Guards
- No runtime type validation
- Assumptions about API response shapes
- No Zod schemas for API responses

**Recommendation:**
```typescript
// Use Zod for runtime validation
import { z } from 'zod';

const TaskResponseSchema = z.object({
  success: z.boolean(),
  data: TaskSchema,
});

// Validate API responses
const response = await axios.get('/tasks/123');
const validated = TaskResponseSchema.parse(response.data);

// Type-safe error handling
function isAxiosError(error: unknown): error is AxiosError {
  return error instanceof Error && 'response' in error;
}

catch (error: unknown) {
  if (isAxiosError(error)) {
    // TypeScript knows error.response exists
  }
}
```

---

### 7. **Accessibility (A11y) Issues**

**Problems:**

#### a) Missing ARIA Labels
```typescript
<button onClick={handleDelete}>
  <Trash2 className="w-3.5 h-3.5" />
</button>
// No aria-label, screen readers can't understand
```

#### b) No Keyboard Navigation
- Drag-and-drop only works with mouse
- No keyboard alternatives
- Focus management issues

#### c) Color Contrast Issues
- Some text colors may not meet WCAG standards
- No focus indicators in some components

**Recommendation:**
```typescript
// Always include ARIA labels
<button
  onClick={handleDelete}
  aria-label="Delete field"
  aria-describedby="delete-field-description"
>
  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
</button>

// Keyboard navigation for drag-and-drop
<button
  onKeyDown={(e) => {
    if (e.key === 'ArrowUp') moveUp();
    if (e.key === 'ArrowDown') moveDown();
  }}
  aria-label="Reorder field"
>
```

---

### 8. **Code Duplication**

**Problems:**

#### a) Repeated Error Handling Patterns
- Same try-catch blocks everywhere
- Same error message extraction logic
- Duplicate toast notifications

#### b) Repeated Loading States
```typescript
// Every component has:
const [isLoading, setIsLoading] = useState(false);
// Should be a hook: useAsyncOperation()
```

#### c) Duplicate Form Validation Logic
- Similar validation in multiple places
- No shared validation utilities

**Recommendation:**
```typescript
// Create reusable hooks
// hooks/useAsyncOperation.ts
export function useAsyncOperation<T, Args extends any[]>(
  operation: (...args: Args) => Promise<T>
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const handleError = useErrorHandler();
  
  const execute = useCallback(async (...args: Args) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await operation(...args);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      handleError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [operation, handleError]);
  
  return { execute, isLoading, error };
}

// Usage
const { execute: saveTask, isLoading } = useAsyncOperation(taskService.updateTask);
```

---

### 9. **Security Issues**

**Problems:**

#### a) Token Storage
- JWT tokens in localStorage (vulnerable to XSS)
- No token refresh mechanism
- No secure token storage option

#### b) No CSRF Protection
- No CSRF tokens
- No SameSite cookie configuration

#### c) Client-Side Validation Only
- Validation happens only in frontend
- No server-side validation feedback

**Recommendation:**
```typescript
// Use httpOnly cookies for tokens (if possible)
// Or use secure storage with encryption
import { secureStorage } from '@/lib/secureStorage';

// Token refresh mechanism
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const newToken = await authService.refreshToken();
        secureStorage.setToken(newToken);
        // Retry original request
        return axios.request(error.config);
      } catch {
        // Refresh failed, logout
        authStore.logout();
      }
    }
    return Promise.reject(error);
  }
);
```

---

### 10. **Testing Gaps**

**Problems:**

#### a) No Unit Tests for Complex Logic
- FlowBuilder save logic has no tests
- Complex reordering logic untested
- No test coverage metrics

#### b) No Integration Tests
- Only E2E tests exist
- No component integration tests
- No API integration tests

#### c) No Test Utilities
- No test helpers for common patterns
- No mock data factories
- No test fixtures

**Recommendation:**
```typescript
// Create test utilities
// tests/utils/testHelpers.tsx
export function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
}

// Mock factories
export const createMockTask = (overrides?: Partial<ITask>): ITask => ({
  id: '1',
  name: 'Test Task',
  // ... defaults
  ...overrides,
});

// Test complex logic
describe('FlowBuilder save logic', () => {
  it('should handle temp levels correctly', async () => {
    // Test implementation
  });
});
```

---

## 🟡 Architecture Issues

### 11. **Tight Coupling**

**Problems:**
- Components directly import services
- No dependency injection
- Hard to mock for testing
- Difficult to swap implementations

**Recommendation:**
```typescript
// Use dependency injection via context
// contexts/ServiceContext.tsx
const ServiceContext = createContext<{
  taskService: TaskService;
  flowService: FlowService;
} | null>(null);

export function ServiceProvider({ children }: { children: React.ReactNode }) {
  const services = useMemo(() => ({
    taskService: new TaskService(),
    flowService: new FlowService(),
  }), []);
  
  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  );
}

// Use in components
const { taskService } = useContext(ServiceContext)!;
```

---

### 12. **No Separation of Business Logic**

**Problems:**
- Business logic mixed with UI components
- Hard to reuse logic
- Difficult to test
- Violates Single Responsibility Principle

**Recommendation:**
```typescript
// Extract business logic to custom hooks
// hooks/useTaskBuilder.ts
export function useTaskBuilder(taskId?: string) {
  const { currentTask, setCurrentTask } = useTaskBuilderStore();
  const { execute: loadTask } = useAsyncOperation(taskService.getTask);
  const { execute: saveTask } = useAsyncOperation(taskService.updateTask);
  
  useEffect(() => {
    if (taskId) {
      loadTask(taskId).then(setCurrentTask);
    }
  }, [taskId]);
  
  const handleSave = useCallback(async () => {
    if (!currentTask) return;
    const saved = await saveTask(currentTask.id, currentTask);
    setCurrentTask(saved);
  }, [currentTask, saveTask, setCurrentTask]);
  
  return {
    task: currentTask,
    save: handleSave,
    // ... other operations
  };
}

// Component becomes thin
export function TaskBuilder() {
  const { id } = useParams();
  const { task, save } = useTaskBuilder(id);
  
  return (
    <div>
      {/* UI only */}
    </div>
  );
}
```

---

## 📋 Recommendations for Fresh Implementation

### Phase 1: Foundation Setup

#### 1. **Choose Better Data Fetching Library**
```bash
npm install @tanstack/react-query
```
- Automatic caching
- Request deduplication
- Background refetching
- Optimistic updates

#### 2. **Add Error Tracking**
```bash
npm install @sentry/react
```
- Production error tracking
- Performance monitoring
- User session replay

#### 3. **Add Form Management**
```bash
npm install react-hook-form zod @hookform/resolvers
```
- Already using, but improve patterns

#### 4. **Add State Management**
```bash
# Keep Zustand, but improve patterns
npm install zustand immer
```
- Use Immer for immutable updates
- Better store organization

---

### Phase 2: Architecture Improvements

#### 1. **Feature-Based Architecture with Layers**

```
src/
├── features/
│   └── task-builder/
│       ├── api/              # API calls (React Query hooks)
│       ├── components/       # UI components
│       ├── hooks/            # Business logic hooks
│       ├── store/            # Local state (Zustand)
│       ├── types/            # TypeScript types
│       └── utils/            # Feature-specific utilities
├── shared/
│   ├── api/                  # Shared API utilities
│   ├── components/           # Shared UI components
│   ├── hooks/                # Shared hooks
│   ├── lib/                  # Third-party configs
│   └── utils/                # Shared utilities
└── app/
    ├── providers/            # Context providers
    ├── routes/               # Route definitions
    └── layouts/              # Layout components
```

#### 2. **API Layer with React Query**

```typescript
// features/task-builder/api/useTasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services/task.service';

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: string) => [...taskKeys.lists(), { filters }] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: taskKeys.list(JSON.stringify(filters)),
    queryFn: () => taskService.listTasks(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => taskService.getTask(id),
    enabled: !!id,
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskData }) =>
      taskService.updateTask(id, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(taskKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}
```

#### 3. **Business Logic Hooks**

```typescript
// features/task-builder/hooks/useTaskBuilder.ts
export function useTaskBuilder(taskId?: string) {
  const { data: task, isLoading } = useTask(taskId!);
  const updateMutation = useUpdateTask();
  const addFieldMutation = useAddField();
  
  const handleSave = useCallback(async () => {
    if (!task) return;
    await updateMutation.mutateAsync({ id: task.id, data: task });
  }, [task, updateMutation]);
  
  const handleAddField = useCallback(async (field: FieldData) => {
    if (!task) return;
    await addFieldMutation.mutateAsync({ taskId: task.id, field });
  }, [task, addFieldMutation]);
  
  return {
    task,
    isLoading,
    save: handleSave,
    addField: handleAddField,
    isSaving: updateMutation.isPending,
  };
}
```

#### 4. **Error Handling System**

```typescript
// shared/lib/errorHandler.ts
import * as Sentry from '@sentry/react';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown, context?: string): AppError {
  let appError: AppError;
  
  if (error instanceof AppError) {
    appError = error;
  } else if (isAxiosError(error)) {
    appError = new AppError(
      error.response?.data?.error?.message || error.message,
      error.response?.data?.error?.code || 'UNKNOWN_ERROR',
      error.response?.status,
      error.response?.data
    );
  } else {
    appError = new AppError(
      'An unexpected error occurred',
      'UNKNOWN_ERROR'
    );
  }
  
  // Log to Sentry
  Sentry.captureException(error, {
    tags: { context },
    extra: { originalError: error },
  });
  
  return appError;
}

// Hook for error handling
export function useErrorHandler() {
  const { showToast } = useToast();
  
  return useCallback((error: unknown, context?: string) => {
    const appError = handleError(error, context);
    
    showToast({
      title: getErrorTitle(appError.code),
      description: appError.message,
      status: 'error',
    });
  }, [showToast]);
}
```

---

### Phase 3: Performance Optimizations

#### 1. **Code Splitting**

```typescript
// app/routes.tsx
import { lazy } from 'react';

const TaskBuilder = lazy(() => import('@/features/task-builder/components/TaskBuilder'));
const FlowBuilder = lazy(() => import('@/features/flow-builder/components/FlowBuilder'));

// Wrap routes in Suspense
<Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/tasks/:id" element={<TaskBuilder />} />
  </Routes>
</Suspense>
```

#### 2. **Memoization**

```typescript
// Memoize expensive components
export const TaskList = React.memo(({ tasks }: TaskListProps) => {
  // Component implementation
});

// Memoize computations
const sortedFields = useMemo(
  () => task.fields.sort((a, b) => a.order - b.order),
  [task.fields]
);

// Memoize callbacks
const handleFieldUpdate = useCallback((fieldId: string, updates: Partial<Field>) => {
  // Handler implementation
}, [/* dependencies */]);
```

#### 3. **Virtual Scrolling for Large Lists**

```typescript
// For long lists (tasks, flows, etc.)
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualizedTaskList({ tasks }: { tasks: ITask[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
  });
  
  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <TaskCard
            key={virtualItem.key}
            task={tasks[virtualItem.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

---

### Phase 4: Developer Experience

#### 1. **Type-Safe API Client**

```typescript
// shared/api/client.ts
import { z } from 'zod';

type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit,
  schema?: z.ZodSchema<T>
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options?.headers,
    },
  });
  
  const data: ApiResponse<T> = await response.json();
  
  if (!data.success) {
    throw new AppError(data.error.message, data.error.code, response.status);
  }
  
  if (schema) {
    return schema.parse(data.data);
  }
  
  return data.data;
}
```

#### 2. **Development Tools**

```typescript
// Add React DevTools Profiler
// Add Zustand DevTools
import { devtools } from 'zustand/middleware';

export const useTaskBuilderStore = create<TaskBuilderState>()(
  devtools(
    (set) => ({
      // Store implementation
    }),
    { name: 'TaskBuilderStore' }
  )
);
```

---

## ✅ Best Practices Checklist

### Code Quality
- [ ] Remove all `console.log` statements (use logger utility)
- [ ] Replace all `any` types with proper types
- [ ] Add Zod schemas for all API responses
- [ ] Extract business logic to custom hooks
- [ ] Use React Query for all data fetching
- [ ] Add error boundaries per feature
- [ ] Implement proper error handling everywhere
- [ ] Add loading states consistently
- [ ] Use TypeScript strict mode

### Performance
- [ ] Implement code splitting for routes
- [ ] Add React.memo for expensive components
- [ ] Use useMemo for expensive computations
- [ ] Use useCallback for event handlers
- [ ] Implement virtual scrolling for long lists
- [ ] Add image lazy loading
- [ ] Optimize bundle size (analyze with webpack-bundle-analyzer)

### Accessibility
- [ ] Add ARIA labels to all interactive elements
- [ ] Ensure keyboard navigation works everywhere
- [ ] Test with screen readers
- [ ] Ensure color contrast meets WCAG AA
- [ ] Add focus indicators
- [ ] Test keyboard shortcuts

### Testing
- [ ] Add unit tests for business logic
- [ ] Add integration tests for features
- [ ] Add E2E tests for critical flows
- [ ] Achieve >80% code coverage
- [ ] Add visual regression tests

### Security
- [ ] Use secure token storage
- [ ] Implement token refresh
- [ ] Add CSRF protection
- [ ] Sanitize user inputs
- [ ] Validate all API responses
- [ ] Add rate limiting on frontend

### Developer Experience
- [ ] Add comprehensive TypeScript types
- [ ] Create reusable hooks library
- [ ] Document component APIs
- [ ] Add Storybook for component development
- [ ] Set up pre-commit hooks (Husky)
- [ ] Add ESLint rules for common mistakes

---

## 🎯 Implementation Priority

### High Priority (Week 1-2)
1. Remove console.log statements
2. Add React Query for data fetching
3. Implement proper error handling
4. Add error tracking (Sentry)
5. Fix type safety issues

### Medium Priority (Week 3-4)
1. Extract business logic to hooks
2. Add code splitting
3. Implement memoization
4. Add accessibility improvements
5. Create reusable utilities

### Low Priority (Week 5+)
1. Add comprehensive tests
2. Performance optimizations
3. Advanced features (offline support, etc.)
4. Developer tooling improvements

---

## 📚 Recommended Libraries

### Core
- **@tanstack/react-query** - Data fetching & caching
- **zustand** - State management (keep, but improve)
- **react-hook-form + zod** - Form management (keep)
- **@sentry/react** - Error tracking

### Performance
- **@tanstack/react-virtual** - Virtual scrolling
- **react-window** - Alternative virtual scrolling
- **web-vitals** - Performance monitoring

### Developer Experience
- **storybook** - Component development
- **msw** - API mocking for tests
- **testing-library** - Component testing (already have)

### Utilities
- **date-fns** - Date manipulation
- **lodash-es** - Utility functions (tree-shakeable)
- **clsx** - Class name utilities (already have)

---

*This document should serve as a guide for building a production-ready, maintainable, and performant frontend application.*

