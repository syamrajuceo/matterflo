# Analytics API Documentation

## Overview

Comprehensive analytics APIs have been added to provide value display and analytics for different pages throughout the application. These APIs aggregate data and provide insights into tasks, flows, users, company performance, and system metrics.

## API Endpoints

All analytics endpoints are available under `/api/analytics` and require authentication.

### 1. Dashboard Statistics
**GET** `/api/analytics/dashboard`

Get comprehensive dashboard statistics including task and flow metrics, user counts, recent activity, and trends.

**Query Parameters:**
- `startDate` (optional) - Filter start date (ISO format)
- `endDate` (optional) - Filter end date (ISO format)
- `departmentId` (optional) - Filter by department
- `roleId` (optional) - Filter by role
- `userId` (optional) - Filter by user

**Response:**
```typescript
{
  success: true,
  data: {
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    taskCompletionRate: number;
    totalFlows: number;
    activeFlows: number;
    completedFlows: number;
    flowCompletionRate: number;
    totalUsers: number;
    activeUsers: number;
    recentTasks: Array<{id, name, status, createdAt}>;
    taskTrends: Array<{date, created, completed}>;
    flowTrends: Array<{date, started, completed}>;
  }
}
```

**Use Cases:**
- Main dashboard page
- Overview statistics cards
- Trend charts
- Recent activity feed

---

### 2. Task Analytics
**GET** `/api/analytics/tasks`

Get detailed analytics for tasks including completion rates, performance metrics, and usage statistics.

**Query Parameters:**
- `startDate` (optional) - Filter start date
- `endDate` (optional) - Filter end date
- `taskId` (optional) - Filter by specific task
- `departmentId` (optional) - Filter by department
- `roleId` (optional) - Filter by role
- `userId` (optional) - Filter by user

**Response:**
```typescript
{
  success: true,
  data: {
    totalTasks: number;
    publishedTasks: number;
    draftTasks: number;
    archivedTasks: number;
    totalExecutions: number;
    completedExecutions: number;
    pendingExecutions: number;
    inProgressExecutions: number;
    completionRate: number;
    averageCompletionTime: number; // hours
    mostUsedTasks: Array<{taskId, taskName, executionCount, completionRate}>;
    executionsByDate: Array<{date, count, completed}>;
    statusDistribution: {pending, inProgress, completed, cancelled};
    fieldCompletionRates: Array<{fieldId, fieldLabel, completionRate}>;
  }
}
```

**Use Cases:**
- Tasks list page analytics
- Task detail page statistics
- Task performance dashboard
- Task usage reports

---

### 3. Flow Analytics
**GET** `/api/analytics/flows`

Get detailed analytics for flows including completion rates, level performance, and bottleneck analysis.

**Query Parameters:**
- `startDate` (optional) - Filter start date
- `endDate` (optional) - Filter end date
- `flowId` (optional) - Filter by specific flow
- `departmentId` (optional) - Filter by department
- `roleId` (optional) - Filter by role
- `userId` (optional) - Filter by user

**Response:**
```typescript
{
  success: true,
  data: {
    totalFlows: number;
    publishedFlows: number;
    draftFlows: number;
    activeInstances: number;
    totalInstances: number;
    completedInstances: number;
    inProgressInstances: number;
    cancelledInstances: number;
    completionRate: number;
    averageCompletionTime: number; // hours
    mostUsedFlows: Array<{flowId, flowName, instanceCount, completionRate, averageTime}>;
    levelPerformance: Array<{levelId, levelName, averageTime, completionRate, bottleneckRate}>;
    instancesByDate: Array<{date, started, completed}>;
    statusDistribution: {inProgress, completed, paused, cancelled};
  }
}
```

**Use Cases:**
- Flows list page analytics
- Flow detail page statistics
- Flow performance dashboard
- Bottleneck identification

---

### 4. User Activity Analytics
**GET** `/api/analytics/users`

Get user activity analytics including top performers, activity trends, and department/role breakdowns.

**Query Parameters:**
- `startDate` (optional) - Filter start date
- `endDate` (optional) - Filter end date
- `departmentId` (optional) - Filter by department
- `roleId` (optional) - Filter by role
- `userId` (optional) - Filter by specific user

**Response:**
```typescript
{
  success: true,
  data: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    totalTaskCompletions: number;
    totalFlowCompletions: number;
    averageTasksPerUser: number;
    averageFlowsPerUser: number;
    topTaskCompleters: Array<{userId, userName, email, completedTasks, completionRate}>;
    topFlowCompleters: Array<{userId, userName, email, completedFlows, completionRate}>;
    activityByDate: Array<{date, activeUsers, taskCompletions, flowCompletions}>;
    activityByDepartment: Array<{departmentId, departmentName, userCount, taskCompletions, flowCompletions}>;
    activityByRole: Array<{roleId, roleName, userCount, taskCompletions, flowCompletions}>;
  }
}
```

**Use Cases:**
- User management page analytics
- Team performance dashboard
- Activity monitoring
- Performance reviews

---

### 5. Company Analytics
**GET** `/api/analytics/company`

Get company-wide analytics including department and role statistics, user distribution, and growth metrics.

**Response:**
```typescript
{
  success: true,
  data: {
    totalDepartments: number;
    totalRoles: number;
    totalUsers: number;
    departmentStats: Array<{departmentId, departmentName, userCount, roleCount, activeUsers, taskCompletions, flowCompletions}>;
    roleStats: Array<{roleId, roleName, userCount, departmentName, averageTaskCompletions, averageFlowCompletions}>;
    usersByDepartment: Array<{departmentName, count}>;
    usersByRole: Array<{roleName, count}>;
    userGrowth: Array<{date, newUsers, totalUsers}>;
  }
}
```

**Use Cases:**
- Company hierarchy page
- Department performance dashboard
- Role analytics
- Growth tracking

---

### 6. Performance Metrics
**GET** `/api/analytics/performance`

Get system performance metrics including completion times, bottlenecks, and efficiency metrics.

**Query Parameters:**
- `startDate` (optional) - Filter start date
- `endDate` (optional) - Filter end date
- `departmentId` (optional) - Filter by department
- `roleId` (optional) - Filter by role

**Response:**
```typescript
{
  success: true,
  data: {
    averageTaskCompletionTime: number; // hours
    averageFlowCompletionTime: number; // hours
    averageResponseTime: number; // milliseconds
    tasksPerDay: number;
    flowsPerDay: number;
    completionsPerDay: number;
    slowestTasks: Array<{taskId, taskName, averageTime, executionCount}>;
    slowestFlows: Array<{flowId, flowName, averageTime, instanceCount}>;
    performanceTrends: Array<{date, averageTaskTime, averageFlowTime, completionRate}>;
    peakActivityHours: Array<{hour, activityCount}>;
  }
}
```

**Use Cases:**
- Performance monitoring dashboard
- Bottleneck identification
- System optimization
- Capacity planning

---

## Frontend Integration

### API Client

The analytics API client is available at:
`frontend/src/features/analytics/api/analyticsApi.ts`

### Usage Example

```typescript
import { analyticsApi } from '@/features/analytics/api/analyticsApi';

// Get dashboard stats
const dashboardStats = await analyticsApi.getDashboardStats({
  startDate: '2024-01-01',
  endDate: '2024-12-31',
});

// Get task analytics
const taskAnalytics = await analyticsApi.getTaskAnalytics({
  taskId: 'task-uuid',
  startDate: '2024-01-01',
});

// Get flow analytics
const flowAnalytics = await analyticsApi.getFlowAnalytics({
  flowId: 'flow-uuid',
});

// Get user activity
const userActivity = await analyticsApi.getUserActivityAnalytics({
  departmentId: 'dept-uuid',
});

// Get company analytics
const companyAnalytics = await analyticsApi.getCompanyAnalytics();

// Get performance metrics
const performance = await analyticsApi.getPerformanceMetrics({
  startDate: '2024-01-01',
  endDate: '2024-12-31',
});
```

---

## Page Integration Guide

### Dashboard Page (`/dashboard`)
Use: `analyticsApi.getDashboardStats()`
- Statistics cards (total tasks, flows, users)
- Task and flow trends charts
- Recent activity feed

### Tasks List Page (`/tasks`)
Use: `analyticsApi.getTaskAnalytics()`
- Task completion rates
- Most used tasks
- Status distribution chart
- Execution trends

### Task Detail Page (`/tasks/:id`)
Use: `analyticsApi.getTaskAnalytics({ taskId })`
- Task-specific completion rate
- Average completion time
- Field completion rates
- Execution history

### Flows List Page (`/flows`)
Use: `analyticsApi.getFlowAnalytics()`
- Flow completion rates
- Most used flows
- Active instances count
- Status distribution

### Flow Detail Page (`/flows/:id`)
Use: `analyticsApi.getFlowAnalytics({ flowId })`
- Flow-specific metrics
- Level performance analysis
- Bottleneck identification
- Instance trends

### Company Hierarchy Page (`/company`)
Use: `analyticsApi.getCompanyAnalytics()`
- Department statistics
- Role statistics
- User distribution charts
- Growth metrics

### User Management Page (`/company/users`)
Use: `analyticsApi.getUserActivityAnalytics()`
- Top performers
- Activity by department/role
- Activity timeline
- User engagement metrics

### Performance Dashboard (New Page)
Use: `analyticsApi.getPerformanceMetrics()`
- System performance overview
- Slowest tasks/flows
- Performance trends
- Peak activity hours

---

## Swagger Documentation

All analytics endpoints are documented in Swagger at:
**http://localhost:3000/api-docs**

Navigate to the **Analytics** tag to see all available endpoints with request/response schemas.

---

## Data Filtering

All analytics endpoints support flexible filtering:

- **Date Range**: Filter data by `startDate` and `endDate`
- **Entity Filtering**: Filter by `taskId`, `flowId`, `userId`
- **Organizational Filtering**: Filter by `departmentId`, `roleId`
- **Combined Filters**: Multiple filters can be combined for precise analytics

---

## Performance Considerations

- Analytics queries are optimized for performance
- Date range filters help limit data processing
- Results are cached where appropriate
- Large date ranges may take longer to process

---

## Future Enhancements

Planned improvements:
- Real-time analytics updates
- Custom date range presets
- Export analytics data to CSV/PDF
- Advanced filtering options
- Comparative analytics (period-over-period)
- Predictive analytics

