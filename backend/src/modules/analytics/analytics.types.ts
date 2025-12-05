export interface DashboardStats {
  // Task Statistics
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  taskCompletionRate: number;
  
  // Flow Statistics
  totalFlows: number;
  activeFlows: number;
  completedFlows: number;
  flowCompletionRate: number;
  
  // User Statistics
  totalUsers: number;
  activeUsers: number;
  
  // Recent Activity
  recentTasks: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
  }>;
  
  // Trends (last 30 days)
  taskTrends: Array<{
    date: string;
    created: number;
    completed: number;
  }>;
  
  flowTrends: Array<{
    date: string;
    started: number;
    completed: number;
  }>;
}

export interface TaskAnalytics {
  // Overview
  totalTasks: number;
  publishedTasks: number;
  draftTasks: number;
  archivedTasks: number;
  
  // Completion Statistics
  totalExecutions: number;
  completedExecutions: number;
  pendingExecutions: number;
  inProgressExecutions: number;
  completionRate: number;
  averageCompletionTime: number; // in hours
  
  // Task Performance
  mostUsedTasks: Array<{
    taskId: string;
    taskName: string;
    executionCount: number;
    completionRate: number;
  }>;
  
  // Time-based Analytics
  executionsByDate: Array<{
    date: string;
    count: number;
    completed: number;
  }>;
  
  // Status Distribution
  statusDistribution: {
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  
  // Field Analytics (for form fields)
  fieldCompletionRates: Array<{
    fieldId: string;
    fieldLabel: string;
    completionRate: number;
  }>;
}

export interface FlowAnalytics {
  // Overview
  totalFlows: number;
  publishedFlows: number;
  draftFlows: number;
  activeInstances: number;
  
  // Completion Statistics
  totalInstances: number;
  completedInstances: number;
  inProgressInstances: number;
  cancelledInstances: number;
  completionRate: number;
  averageCompletionTime: number; // in hours
  
  // Flow Performance
  mostUsedFlows: Array<{
    flowId: string;
    flowName: string;
    instanceCount: number;
    completionRate: number;
    averageTime: number;
  }>;
  
  // Level Analytics
  levelPerformance: Array<{
    levelId: string;
    levelName: string;
    averageTime: number;
    completionRate: number;
    bottleneckRate: number; // percentage of instances stuck at this level
  }>;
  
  // Time-based Analytics
  instancesByDate: Array<{
    date: string;
    started: number;
    completed: number;
  }>;
  
  // Status Distribution
  statusDistribution: {
    inProgress: number;
    completed: number;
    paused: number;
    cancelled: number;
  };
}

export interface UserActivityAnalytics {
  // User Overview
  totalUsers: number;
  activeUsers: number; // users active in last 30 days
  newUsers: number; // users created in last 30 days
  
  // Activity Metrics
  totalTaskCompletions: number;
  totalFlowCompletions: number;
  averageTasksPerUser: number;
  averageFlowsPerUser: number;
  
  // Top Performers
  topTaskCompleters: Array<{
    userId: string;
    userName: string;
    email: string;
    completedTasks: number;
    completionRate: number;
  }>;
  
  topFlowCompleters: Array<{
    userId: string;
    userName: string;
    email: string;
    completedFlows: number;
    completionRate: number;
  }>;
  
  // Activity Timeline
  activityByDate: Array<{
    date: string;
    activeUsers: number;
    taskCompletions: number;
    flowCompletions: number;
  }>;
  
  // Department/Role Breakdown
  activityByDepartment: Array<{
    departmentId: string;
    departmentName: string;
    userCount: number;
    taskCompletions: number;
    flowCompletions: number;
  }>;
  
  activityByRole: Array<{
    roleId: string;
    roleName: string;
    userCount: number;
    taskCompletions: number;
    flowCompletions: number;
  }>;
}

export interface CompanyAnalytics {
  // Company Overview
  totalDepartments: number;
  totalRoles: number;
  totalUsers: number;
  
  // Department Statistics
  departmentStats: Array<{
    departmentId: string;
    departmentName: string;
    userCount: number;
    roleCount: number;
    activeUsers: number;
    taskCompletions: number;
    flowCompletions: number;
  }>;
  
  // Role Statistics
  roleStats: Array<{
    roleId: string;
    roleName: string;
    userCount: number;
    departmentName?: string;
    averageTaskCompletions: number;
    averageFlowCompletions: number;
  }>;
  
  // User Distribution
  usersByDepartment: Array<{
    departmentName: string;
    count: number;
  }>;
  
  usersByRole: Array<{
    roleName: string;
    count: number;
  }>;
  
  // Growth Metrics
  userGrowth: Array<{
    date: string;
    newUsers: number;
    totalUsers: number;
  }>;
}

export interface PerformanceMetrics {
  // System Performance
  averageTaskCompletionTime: number; // hours
  averageFlowCompletionTime: number; // hours
  averageResponseTime: number; // milliseconds
  
  // Efficiency Metrics
  tasksPerDay: number;
  flowsPerDay: number;
  completionsPerDay: number;
  
  // Bottlenecks
  slowestTasks: Array<{
    taskId: string;
    taskName: string;
    averageTime: number;
    executionCount: number;
  }>;
  
  slowestFlows: Array<{
    flowId: string;
    flowName: string;
    averageTime: number;
    instanceCount: number;
  }>;
  
  // Trends
  performanceTrends: Array<{
    date: string;
    averageTaskTime: number;
    averageFlowTime: number;
    completionRate: number;
  }>;
  
  // Peak Times
  peakActivityHours: Array<{
    hour: number;
    activityCount: number;
  }>;
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export interface AnalyticsFilters extends DateRangeParams {
  departmentId?: string;
  roleId?: string;
  userId?: string;
  flowId?: string;
  taskId?: string;
}

