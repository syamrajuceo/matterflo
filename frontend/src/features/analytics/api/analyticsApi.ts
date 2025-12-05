import { apiClient, extractApiData, type ApiResponse } from '@/lib/api-client';

// Types
export interface DashboardStats {
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
  recentTasks: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
  }>;
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
  totalTasks: number;
  publishedTasks: number;
  draftTasks: number;
  archivedTasks: number;
  totalExecutions: number;
  completedExecutions: number;
  pendingExecutions: number;
  inProgressExecutions: number;
  completionRate: number;
  averageCompletionTime: number;
  mostUsedTasks: Array<{
    taskId: string;
    taskName: string;
    executionCount: number;
    completionRate: number;
  }>;
  executionsByDate: Array<{
    date: string;
    count: number;
    completed: number;
  }>;
  statusDistribution: {
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  fieldCompletionRates: Array<{
    fieldId: string;
    fieldLabel: string;
    completionRate: number;
  }>;
}

export interface FlowAnalytics {
  totalFlows: number;
  publishedFlows: number;
  draftFlows: number;
  activeInstances: number;
  totalInstances: number;
  completedInstances: number;
  inProgressInstances: number;
  cancelledInstances: number;
  completionRate: number;
  averageCompletionTime: number;
  mostUsedFlows: Array<{
    flowId: string;
    flowName: string;
    instanceCount: number;
    completionRate: number;
    averageTime: number;
  }>;
  levelPerformance: Array<{
    levelId: string;
    levelName: string;
    averageTime: number;
    completionRate: number;
    bottleneckRate: number;
  }>;
  instancesByDate: Array<{
    date: string;
    started: number;
    completed: number;
  }>;
  statusDistribution: {
    inProgress: number;
    completed: number;
    paused: number;
    cancelled: number;
  };
}

export interface UserActivityAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  totalTaskCompletions: number;
  totalFlowCompletions: number;
  averageTasksPerUser: number;
  averageFlowsPerUser: number;
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
  activityByDate: Array<{
    date: string;
    activeUsers: number;
    taskCompletions: number;
    flowCompletions: number;
  }>;
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
  totalDepartments: number;
  totalRoles: number;
  totalUsers: number;
  departmentStats: Array<{
    departmentId: string;
    departmentName: string;
    userCount: number;
    roleCount: number;
    activeUsers: number;
    taskCompletions: number;
    flowCompletions: number;
  }>;
  roleStats: Array<{
    roleId: string;
    roleName: string;
    userCount: number;
    departmentName?: string;
    averageTaskCompletions: number;
    averageFlowCompletions: number;
  }>;
  usersByDepartment: Array<{
    departmentName: string;
    count: number;
  }>;
  usersByRole: Array<{
    roleName: string;
    count: number;
  }>;
  userGrowth: Array<{
    date: string;
    newUsers: number;
    totalUsers: number;
  }>;
}

export interface PerformanceMetrics {
  averageTaskCompletionTime: number;
  averageFlowCompletionTime: number;
  averageResponseTime: number;
  tasksPerDay: number;
  flowsPerDay: number;
  completionsPerDay: number;
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
  performanceTrends: Array<{
    date: string;
    averageTaskTime: number;
    averageFlowTime: number;
    completionRate: number;
  }>;
  peakActivityHours: Array<{
    hour: number;
    activityCount: number;
  }>;
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  roleId?: string;
  userId?: string;
  flowId?: string;
  taskId?: string;
}

// API functions
export const analyticsApi = {
  /**
   * Get dashboard statistics
   * GET /api/analytics/dashboard
   */
  getDashboardStats: async (filters?: AnalyticsFilters): Promise<DashboardStats> => {
    const response = await apiClient.get<ApiResponse<DashboardStats>>('/analytics/dashboard', {
      params: filters,
    });
    return extractApiData(response);
  },

  /**
   * Get task analytics
   * GET /api/analytics/tasks
   */
  getTaskAnalytics: async (filters?: AnalyticsFilters): Promise<TaskAnalytics> => {
    const response = await apiClient.get<ApiResponse<TaskAnalytics>>('/analytics/tasks', {
      params: filters,
    });
    return extractApiData(response);
  },

  /**
   * Get flow analytics
   * GET /api/analytics/flows
   */
  getFlowAnalytics: async (filters?: AnalyticsFilters): Promise<FlowAnalytics> => {
    const response = await apiClient.get<ApiResponse<FlowAnalytics>>('/analytics/flows', {
      params: filters,
    });
    return extractApiData(response);
  },

  /**
   * Get user activity analytics
   * GET /api/analytics/users
   */
  getUserActivityAnalytics: async (filters?: AnalyticsFilters): Promise<UserActivityAnalytics> => {
    const response = await apiClient.get<ApiResponse<UserActivityAnalytics>>('/analytics/users', {
      params: filters,
    });
    return extractApiData(response);
  },

  /**
   * Get company analytics
   * GET /api/analytics/company
   */
  getCompanyAnalytics: async (): Promise<CompanyAnalytics> => {
    const response = await apiClient.get<ApiResponse<CompanyAnalytics>>('/analytics/company');
    return extractApiData(response);
  },

  /**
   * Get performance metrics
   * GET /api/analytics/performance
   */
  getPerformanceMetrics: async (filters?: AnalyticsFilters): Promise<PerformanceMetrics> => {
    const response = await apiClient.get<ApiResponse<PerformanceMetrics>>('/analytics/performance', {
      params: filters,
    });
    return extractApiData(response);
  },
};

