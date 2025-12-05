import { prisma } from '../../common/config/database.config';
import type {
  DashboardStats,
  TaskAnalytics,
  FlowAnalytics,
  UserActivityAnalytics,
  CompanyAnalytics,
  PerformanceMetrics,
  AnalyticsFilters,
} from './analytics.types';

class AnalyticsService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(companyId: string, filters?: AnalyticsFilters): Promise<DashboardStats> {
    const whereClause: any = { companyId };
    
    // Apply date filters if provided
    if (filters?.startDate || filters?.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) whereClause.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) whereClause.createdAt.lte = new Date(filters.endDate);
    }

    // Task Statistics
    const [
      totalTasks,
      activeTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      totalFlows,
      activeFlows,
      completedFlows,
      totalUsers,
      activeUsers,
    ] = await Promise.all([
      prisma.task.count({ where: whereClause }),
      prisma.task.count({ where: { ...whereClause, status: 'PUBLISHED' } }),
      prisma.taskExecution.count({
        where: {
          task: { companyId },
          status: 'COMPLETED',
          ...(filters?.startDate || filters?.endDate ? {
            completedAt: {
              ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
              ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
            },
          } : {}),
        },
      }),
      prisma.taskExecution.count({
        where: {
          task: { companyId },
          status: 'PENDING',
        },
      }),
      // Overdue tasks - tasks that are pending and created more than 7 days ago
      prisma.taskExecution.count({
        where: {
          task: { companyId },
          status: 'PENDING',
          createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.flow.count({ where: whereClause }),
      prisma.flowInstance.count({
        where: {
          flow: { companyId },
          status: 'IN_PROGRESS',
        },
      }),
      prisma.flowInstance.count({
        where: {
          flow: { companyId },
          status: 'COMPLETED',
          ...(filters?.startDate || filters?.endDate ? {
            completedAt: {
              ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
              ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
            },
          } : {}),
        },
      }),
      prisma.user.count({ where: { companyId } }),
      prisma.user.count({
        where: {
          companyId,
          completedTasks: {
            some: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
          },
        },
      }),
    ]);

    const totalExecutions = await prisma.taskExecution.count({
      where: { task: { companyId } },
    });

    const taskCompletionRate = totalExecutions > 0 
      ? (completedTasks / totalExecutions) * 100 
      : 0;

    const flowCompletionRate = totalFlows > 0 
      ? (completedFlows / totalFlows) * 100 
      : 0;

    // Recent Tasks
    const recentTasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
      },
    });

    // Task Trends (last 30 days)
    const taskTrends = await this.getTaskTrends(companyId, 30);
    
    // Flow Trends (last 30 days)
    const flowTrends = await this.getFlowTrends(companyId, 30);

    return {
      totalTasks,
      activeTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      taskCompletionRate,
      totalFlows,
      activeFlows,
      completedFlows,
      flowCompletionRate,
      totalUsers,
      activeUsers,
      recentTasks: recentTasks.map(t => ({
        id: t.id,
        name: t.name,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
      })),
      taskTrends,
      flowTrends,
    };
  }

  /**
   * Get task analytics
   */
  async getTaskAnalytics(companyId: string, filters?: AnalyticsFilters): Promise<TaskAnalytics> {
    const whereClause: any = { companyId };

    const [
      totalTasks,
      publishedTasks,
      draftTasks,
      archivedTasks,
      totalExecutions,
      completedExecutions,
      pendingExecutions,
      inProgressExecutions,
    ] = await Promise.all([
      prisma.task.count({ where: whereClause }),
      prisma.task.count({ where: { ...whereClause, status: 'PUBLISHED' } }),
      prisma.task.count({ where: { ...whereClause, status: 'DRAFT' } }),
      prisma.task.count({ where: { ...whereClause, status: 'ARCHIVED' } }),
      prisma.taskExecution.count({
        where: {
          task: { companyId },
          ...(filters?.taskId ? { taskId: filters.taskId } : {}),
        },
      }),
      prisma.taskExecution.count({
        where: {
          task: { companyId },
          status: 'COMPLETED',
          ...(filters?.taskId ? { taskId: filters.taskId } : {}),
        },
      }),
      prisma.taskExecution.count({
        where: {
          task: { companyId },
          status: 'PENDING',
          ...(filters?.taskId ? { taskId: filters.taskId } : {}),
        },
      }),
      prisma.taskExecution.count({
        where: {
          task: { companyId },
          status: 'IN_PROGRESS',
          ...(filters?.taskId ? { taskId: filters.taskId } : {}),
        },
      }),
    ]);

    const completionRate = totalExecutions > 0 
      ? (completedExecutions / totalExecutions) * 100 
      : 0;

    // Calculate average completion time
    const completedExecutionsWithTime = await prisma.taskExecution.findMany({
      where: {
        task: { companyId },
        status: 'COMPLETED',
        ...(filters?.taskId ? { taskId: filters.taskId } : {}),
      },
      select: {
        createdAt: true,
        completedAt: true,
      },
    });

    // Filter out null values in application code
    const validExecutions = completedExecutionsWithTime.filter(
      exec => exec.completedAt !== null && exec.createdAt !== null
    );

    const averageCompletionTime = validExecutions.length > 0
      ? validExecutions.reduce((sum, exec) => {
          const timeDiff = exec.completedAt!.getTime() - exec.createdAt!.getTime();
          return sum + (timeDiff / (1000 * 60 * 60)); // Convert to hours
        }, 0) / validExecutions.length
      : 0;

    // Most Used Tasks
    const taskUsage = await prisma.taskExecution.groupBy({
      by: ['taskId'],
      where: {
        task: { companyId },
      },
      _count: { id: true },
    });

    const mostUsedTasks = await Promise.all(
      taskUsage
        .sort((a, b) => b._count.id - a._count.id)
        .slice(0, 10)
        .map(async (usage) => {
          const task = await prisma.task.findUnique({
            where: { id: usage.taskId },
            select: { name: true },
          });
          const completed = await prisma.taskExecution.count({
            where: {
              taskId: usage.taskId,
              status: 'COMPLETED',
            },
          });
          return {
            taskId: usage.taskId,
            taskName: task?.name || 'Unknown',
            executionCount: usage._count.id,
            completionRate: usage._count.id > 0 ? (completed / usage._count.id) * 100 : 0,
          };
        })
    );

    // Executions by Date
    const executionsByDate = await this.getTaskExecutionsByDate(companyId, filters);

    return {
      totalTasks,
      publishedTasks,
      draftTasks,
      archivedTasks,
      totalExecutions,
      completedExecutions,
      pendingExecutions,
      inProgressExecutions,
      completionRate,
      averageCompletionTime,
      mostUsedTasks,
      executionsByDate,
      statusDistribution: {
        pending: pendingExecutions,
        inProgress: inProgressExecutions,
        completed: completedExecutions,
        cancelled: await prisma.taskExecution.count({
          where: {
            task: { companyId },
            status: 'FAILED',
            ...(filters?.taskId ? { taskId: filters.taskId } : {}),
          },
        }),
      },
      fieldCompletionRates: [], // TODO: Implement field-level analytics
    };
  }

  /**
   * Get flow analytics
   */
  async getFlowAnalytics(companyId: string, filters?: AnalyticsFilters): Promise<FlowAnalytics> {
    const whereClause: any = { companyId };

    const [
      totalFlows,
      publishedFlows,
      draftFlows,
      activeInstances,
      totalInstances,
      completedInstances,
      inProgressInstances,
      cancelledInstances,
    ] = await Promise.all([
      prisma.flow.count({ where: whereClause }),
      prisma.flow.count({ where: { ...whereClause, status: 'PUBLISHED' } }),
      prisma.flow.count({ where: { ...whereClause, status: 'DRAFT' } }),
      prisma.flowInstance.count({
        where: {
          flow: { companyId },
          status: 'IN_PROGRESS',
        },
      }),
      prisma.flowInstance.count({
        where: {
          flow: { companyId },
          ...(filters?.flowId ? { flowId: filters.flowId } : {}),
        },
      }),
      prisma.flowInstance.count({
        where: {
          flow: { companyId },
          status: 'COMPLETED',
          ...(filters?.flowId ? { flowId: filters.flowId } : {}),
        },
      }),
      prisma.flowInstance.count({
        where: {
          flow: { companyId },
          status: 'IN_PROGRESS',
          ...(filters?.flowId ? { flowId: filters.flowId } : {}),
        },
      }),
      prisma.flowInstance.count({
        where: {
          flow: { companyId },
          status: 'CANCELLED',
          ...(filters?.flowId ? { flowId: filters.flowId } : {}),
        },
      }),
    ]);

    const completionRate = totalInstances > 0 
      ? (completedInstances / totalInstances) * 100 
      : 0;

    // Calculate average completion time
    const completedInstancesWithTime = await prisma.flowInstance.findMany({
      where: {
        flow: { companyId },
        status: 'COMPLETED',
        ...(filters?.flowId ? { flowId: filters.flowId } : {}),
      },
      select: {
        startedAt: true,
        completedAt: true,
      },
    });

    // Filter out null values in application code
    const validInstances = completedInstancesWithTime.filter(
      inst => inst.completedAt !== null && inst.startedAt !== null
    );

    const averageCompletionTime = validInstances.length > 0
      ? validInstances.reduce((sum, instance) => {
          const timeDiff = instance.completedAt!.getTime() - instance.startedAt!.getTime();
          return sum + (timeDiff / (1000 * 60 * 60)); // Convert to hours
        }, 0) / validInstances.length
      : 0;

    // Most Used Flows
    const flowUsage = await prisma.flowInstance.groupBy({
      by: ['flowId'],
      where: {
        flow: { companyId },
      },
      _count: { id: true },
    });

    const mostUsedFlows = await Promise.all(
      flowUsage
        .sort((a, b) => b._count.id - a._count.id)
        .slice(0, 10)
        .map(async (usage) => {
          const flow = await prisma.flow.findUnique({
            where: { id: usage.flowId },
            select: { name: true },
          });
          const completed = await prisma.flowInstance.count({
            where: {
              flowId: usage.flowId,
              status: 'COMPLETED',
            },
          });
          const avgTime = await this.getAverageFlowCompletionTime(usage.flowId);
          return {
            flowId: usage.flowId,
            flowName: flow?.name || 'Unknown',
            instanceCount: usage._count.id,
            completionRate: usage._count.id > 0 ? (completed / usage._count.id) * 100 : 0,
            averageTime: avgTime,
          };
        })
    );

    // Instances by Date
    const instancesByDate = await this.getFlowInstancesByDate(companyId, filters);

    return {
      totalFlows,
      publishedFlows,
      draftFlows,
      activeInstances,
      totalInstances,
      completedInstances,
      inProgressInstances,
      cancelledInstances,
      completionRate,
      averageCompletionTime,
      mostUsedFlows,
      levelPerformance: [], // TODO: Implement level performance analytics
      instancesByDate,
      statusDistribution: {
        inProgress: inProgressInstances,
        completed: completedInstances,
      paused: 0, // PAUSED status doesn't exist in schema
        cancelled: cancelledInstances,
      },
    };
  }

  /**
   * Get user activity analytics
   */
  async getUserActivityAnalytics(companyId: string, filters?: AnalyticsFilters): Promise<UserActivityAnalytics> {
    const whereClause: any = { companyId };

    const [
      totalUsers,
      activeUsers,
      newUsers,
      totalTaskCompletions,
      totalFlowCompletions,
    ] = await Promise.all([
      prisma.user.count({ where: whereClause }),
      prisma.user.count({
        where: {
          companyId,
          completedTasks: {
            some: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          },
        },
      }),
      prisma.user.count({
        where: {
          companyId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.taskExecution.count({
        where: {
          task: { companyId },
          status: 'COMPLETED',
          ...(filters?.userId ? { executorId: filters.userId } : {}),
        },
      }),
      prisma.flowInstance.count({
        where: {
          flow: { companyId },
          status: 'COMPLETED',
          ...(filters?.userId ? { initiatorId: filters.userId } : {}),
        },
      }),
    ]);

    const averageTasksPerUser = totalUsers > 0 ? totalTaskCompletions / totalUsers : 0;
    const averageFlowsPerUser = totalUsers > 0 ? totalFlowCompletions / totalUsers : 0;

    // Top Task Completers
    const taskCompleters = await prisma.taskExecution.groupBy({
      by: ['executorId'],
      where: {
        task: { companyId },
        status: 'COMPLETED',
      },
      _count: { id: true },
    });

    const topTaskCompleters = await Promise.all(
      taskCompleters
        .sort((a, b) => b._count.id - a._count.id)
        .slice(0, 10)
        .map(async (completer) => {
          const user = await prisma.user.findUnique({
            where: { id: completer.executorId },
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          });
          const totalTasks = await prisma.taskExecution.count({
            where: { executorId: completer.executorId },
          });
          return {
            userId: completer.executorId,
            userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown',
            email: user?.email || '',
            completedTasks: completer._count.id,
            completionRate: totalTasks > 0 ? (completer._count.id / totalTasks) * 100 : 0,
          };
        })
    );

    // Top Flow Completers
    const flowCompleters = await prisma.flowInstance.groupBy({
      by: ['initiatorId'],
      where: {
        flow: { companyId },
        status: 'COMPLETED',
      },
      _count: { id: true },
    });

    const topFlowCompleters = await Promise.all(
      flowCompleters
        .sort((a, b) => b._count.id - a._count.id)
        .slice(0, 10)
        .map(async (completer) => {
          const user = await prisma.user.findUnique({
            where: { id: completer.initiatorId },
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          });
          const totalFlows = await prisma.flowInstance.count({
            where: { initiatorId: completer.initiatorId },
          });
          return {
            userId: completer.initiatorId,
            userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown',
            email: user?.email || '',
            completedFlows: completer._count.id,
            completionRate: totalFlows > 0 ? (completer._count.id / totalFlows) * 100 : 0,
          };
        })
    );

    // Activity by Date
    const activityByDate = await this.getActivityByDate(companyId, filters);

    // Activity by Department
    const activityByDepartment = await this.getActivityByDepartment(companyId, filters);

    // Activity by Role
    const activityByRole = await this.getActivityByRole(companyId, filters);

    return {
      totalUsers,
      activeUsers,
      newUsers,
      totalTaskCompletions,
      totalFlowCompletions,
      averageTasksPerUser,
      averageFlowsPerUser,
      topTaskCompleters,
      topFlowCompleters,
      activityByDate,
      activityByDepartment,
      activityByRole,
    };
  }

  /**
   * Get company analytics
   */
  async getCompanyAnalytics(companyId: string): Promise<CompanyAnalytics> {
    const [totalDepartments, totalRoles, totalUsers] = await Promise.all([
      prisma.department.count({ where: { companyId } }),
      prisma.role.count({ where: { companyId } }),
      prisma.user.count({ where: { companyId } }),
    ]);

    // Department Statistics
    const departments = await prisma.department.findMany({
      where: { companyId },
      include: {
        roles: true,
      },
    });

    const departmentStats = await Promise.all(
      departments.map(async (dept) => {
        // Count users by checking roles in this department
        const roleIds = dept.roles.map(r => r.id);
        const userCount = await prisma.user.count({
          where: {
            companyId,
            // Note: Users don't have direct department relation, so we can't accurately count
            // This is a limitation of the current schema
          },
        });
        const activeUsers = await prisma.user.count({
          where: {
            companyId,
            completedTasks: {
              some: {
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                },
              },
            },
          },
        });
        // Since users don't have departmentId, we can't filter by department
        const taskCompletions = 0; // Cannot accurately calculate without department relation
        const flowCompletions = 0; // Cannot accurately calculate without department relation
        return {
          departmentId: dept.id,
          departmentName: dept.name,
          userCount: 0, // Cannot accurately calculate
          roleCount: dept.roles.length,
          activeUsers: 0, // Cannot accurately calculate
          taskCompletions,
          flowCompletions,
        };
      })
    );

    // Role Statistics
    const roles = await prisma.role.findMany({
      where: { companyId },
      include: {
        department: true,
      },
    });

    const roleStats = await Promise.all(
      roles.map(async (role) => {
        // Count users with matching role enum (users.role field)
        const userCount = await prisma.user.count({
          where: {
            companyId,
            role: role.name as any, // Match role name to UserRole enum if possible
          },
        });
        // Since users don't have roleId relation, we can't accurately filter by role
        const taskCompletions = 0; // Cannot accurately calculate without role relation
        const flowCompletions = 0; // Cannot accurately calculate without role relation
        return {
          roleId: role.id,
          roleName: role.name,
          userCount,
          departmentName: role.department?.name,
          averageTaskCompletions: userCount > 0 ? taskCompletions / userCount : 0,
          averageFlowCompletions: userCount > 0 ? flowCompletions / userCount : 0,
        };
      })
    );

    // User Distribution by Role (using role enum field)
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      where: { companyId },
      _count: { id: true },
    });

    const usersByRoleData = usersByRole.map((group) => {
      return {
        roleName: group.role,
        count: group._count?.id || 0,
      };
    });

    // Users by Department - cannot calculate accurately without department relation
    const usersByDepartmentData: Array<{ departmentName: string; count: number }> = [];

    // User Growth
    const userGrowth = await this.getUserGrowth(companyId, 30);

    return {
      totalDepartments,
      totalRoles,
      totalUsers,
      departmentStats,
      roleStats,
      usersByDepartment: usersByDepartmentData,
      usersByRole: usersByRoleData,
      userGrowth,
    };
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(companyId: string, filters?: AnalyticsFilters): Promise<PerformanceMetrics> {
    // Average Task Completion Time
    const completedTasks = await prisma.taskExecution.findMany({
      where: {
        task: { companyId },
        status: 'COMPLETED',
      },
      select: {
        createdAt: true,
        completedAt: true,
      },
    });

    // Filter out null values
    const validTasks = completedTasks.filter(
      task => task.completedAt !== null && task.createdAt !== null
    );

    const averageTaskCompletionTime = validTasks.length > 0
      ? validTasks.reduce((sum, task) => {
          const timeDiff = task.completedAt!.getTime() - task.createdAt!.getTime();
          return sum + (timeDiff / (1000 * 60 * 60)); // Convert to hours
        }, 0) / validTasks.length
      : 0;

    // Average Flow Completion Time
    const completedFlows = await prisma.flowInstance.findMany({
      where: {
        flow: { companyId },
        status: 'COMPLETED',
      },
      select: {
        startedAt: true,
        completedAt: true,
      },
    });

    // Filter out null values
    const validFlows = completedFlows.filter(
      flow => flow.completedAt !== null && flow.startedAt !== null
    );

    const averageFlowCompletionTime = validFlows.length > 0
      ? validFlows.reduce((sum, flow) => {
          const timeDiff = flow.completedAt!.getTime() - flow.startedAt!.getTime();
          return sum + (timeDiff / (1000 * 60 * 60)); // Convert to hours
        }, 0) / validFlows.length
      : 0;

    // Tasks/Flows per Day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tasksToday = await prisma.taskExecution.count({
      where: {
        task: { companyId },
        createdAt: { gte: today },
      },
    });
    const flowsToday = await prisma.flowInstance.count({
      where: {
        flow: { companyId },
        startedAt: { gte: today },
      },
    });
    const completionsToday = await prisma.taskExecution.count({
      where: {
        task: { companyId },
        status: 'COMPLETED',
        completedAt: { gte: today },
      },
    });

    // Slowest Tasks
    const taskTimes = await Promise.all(
      (await prisma.task.findMany({
        where: { companyId },
        select: { id: true, name: true },
      })).map(async (task) => {
        const executions = await prisma.taskExecution.findMany({
          where: {
            taskId: task.id,
            status: 'COMPLETED',
          },
          select: {
            createdAt: true,
            completedAt: true,
          },
        });
        const validExecutions = executions.filter(
          exec => exec.completedAt !== null && exec.createdAt !== null
        );
        if (validExecutions.length === 0) return null;
        const avgTime = validExecutions.reduce((sum, exec) => {
          const timeDiff = exec.completedAt!.getTime() - exec.createdAt!.getTime();
          return sum + (timeDiff / (1000 * 60 * 60));
        }, 0) / validExecutions.length;
        return {
          taskId: task.id,
          taskName: task.name,
          averageTime: avgTime,
          executionCount: executions.length,
        };
      })
    );

    const slowestTasks = taskTimes
      .filter((t): t is NonNullable<typeof t> => t !== null)
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);

    // Slowest Flows
    const flowTimes = await Promise.all(
      (await prisma.flow.findMany({
        where: { companyId },
        select: { id: true, name: true },
      })).map(async (flow) => {
        const instances = await prisma.flowInstance.findMany({
          where: {
            flowId: flow.id,
            status: 'COMPLETED',
          },
          select: {
            startedAt: true,
            completedAt: true,
          },
        });
        const validInstances = instances.filter(
          inst => inst.completedAt !== null && inst.startedAt !== null
        );
        if (validInstances.length === 0) return null;
        const avgTime = validInstances.reduce((sum, inst) => {
          const timeDiff = inst.completedAt!.getTime() - inst.startedAt!.getTime();
          return sum + (timeDiff / (1000 * 60 * 60));
        }, 0) / validInstances.length;
        return {
          flowId: flow.id,
          flowName: flow.name,
          averageTime: avgTime,
          instanceCount: instances.length,
        };
      })
    );

    const slowestFlows = flowTimes
      .filter((f): f is NonNullable<typeof f> => f !== null)
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);

    // Performance Trends
    const performanceTrends = await this.getPerformanceTrends(companyId, 30);

    // Peak Activity Hours
    const peakActivityHours = await this.getPeakActivityHours(companyId);

    return {
      averageTaskCompletionTime,
      averageFlowCompletionTime,
      averageResponseTime: 0, // TODO: Implement API response time tracking
      tasksPerDay: tasksToday,
      flowsPerDay: flowsToday,
      completionsPerDay: completionsToday,
      slowestTasks,
      slowestFlows,
      performanceTrends,
      peakActivityHours,
    };
  }

  // Helper methods
  private async getTaskTrends(companyId: string, days: number): Promise<Array<{ date: string; created: number; completed: number }>> {
    const trends: Array<{ date: string; created: number; completed: number }> = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [created, completed] = await Promise.all([
        prisma.task.count({
          where: {
            companyId,
            createdAt: { gte: date, lt: nextDate },
          },
        }),
        prisma.taskExecution.count({
          where: {
            task: { companyId },
            status: 'COMPLETED',
            completedAt: { gte: date, lt: nextDate },
          },
        }),
      ]);

      trends.push({
        date: date.toISOString().split('T')[0],
        created,
        completed,
      });
    }

    return trends;
  }

  private async getFlowTrends(companyId: string, days: number): Promise<Array<{ date: string; started: number; completed: number }>> {
    const trends: Array<{ date: string; started: number; completed: number }> = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [started, completed] = await Promise.all([
        prisma.flowInstance.count({
          where: {
            flow: { companyId },
            startedAt: { gte: date, lt: nextDate },
          },
        }),
        prisma.flowInstance.count({
          where: {
            flow: { companyId },
            status: 'COMPLETED',
            completedAt: { gte: date, lt: nextDate },
          },
        }),
      ]);

      trends.push({
        date: date.toISOString().split('T')[0],
        started,
        completed,
      });
    }

    return trends;
  }

  private async getTaskExecutionsByDate(companyId: string, filters?: AnalyticsFilters): Promise<Array<{ date: string; count: number; completed: number }>> {
    const days = filters?.startDate && filters?.endDate
      ? Math.ceil((new Date(filters.endDate).getTime() - new Date(filters.startDate).getTime()) / (1000 * 60 * 60 * 24))
      : 30;
    
    const trends: Array<{ date: string; count: number; completed: number }> = [];
    const startDate = filters?.startDate ? new Date(filters.startDate) : new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [count, completed] = await Promise.all([
        prisma.taskExecution.count({
          where: {
            task: { companyId },
            createdAt: { gte: date, lt: nextDate },
            ...(filters?.taskId ? { taskId: filters.taskId } : {}),
          },
        }),
        prisma.taskExecution.count({
          where: {
            task: { companyId },
            status: 'COMPLETED',
            completedAt: { gte: date, lt: nextDate },
            ...(filters?.taskId ? { taskId: filters.taskId } : {}),
          },
        }),
      ]);

      trends.push({
        date: date.toISOString().split('T')[0],
        count,
        completed,
      });
    }

    return trends;
  }

  private async getFlowInstancesByDate(companyId: string, filters?: AnalyticsFilters): Promise<Array<{ date: string; started: number; completed: number }>> {
    const days = filters?.startDate && filters?.endDate
      ? Math.ceil((new Date(filters.endDate).getTime() - new Date(filters.startDate).getTime()) / (1000 * 60 * 60 * 24))
      : 30;
    
    const trends: Array<{ date: string; started: number; completed: number }> = [];
    const startDate = filters?.startDate ? new Date(filters.startDate) : new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [started, completed] = await Promise.all([
        prisma.flowInstance.count({
          where: {
            flow: { companyId },
            startedAt: { gte: date, lt: nextDate },
            ...(filters?.flowId ? { flowId: filters.flowId } : {}),
          },
        }),
        prisma.flowInstance.count({
          where: {
            flow: { companyId },
            status: 'COMPLETED',
            completedAt: { gte: date, lt: nextDate },
            ...(filters?.flowId ? { flowId: filters.flowId } : {}),
          },
        }),
      ]);

      trends.push({
        date: date.toISOString().split('T')[0],
        started,
        completed,
      });
    }

    return trends;
  }

  private async getAverageFlowCompletionTime(flowId: string): Promise<number> {
    const instances = await prisma.flowInstance.findMany({
      where: {
        flowId,
        status: 'COMPLETED',
      },
      select: {
        startedAt: true,
        completedAt: true,
      },
    });

    const validInstances = instances.filter(
      inst => inst.completedAt !== null && inst.startedAt !== null
    );

    if (validInstances.length === 0) return 0;

    const totalTime = validInstances.reduce((sum, inst) => {
      const timeDiff = inst.completedAt!.getTime() - inst.startedAt!.getTime();
      return sum + (timeDiff / (1000 * 60 * 60));
    }, 0);

    return totalTime / validInstances.length;
  }

  private async getActivityByDate(companyId: string, filters?: AnalyticsFilters): Promise<Array<{ date: string; activeUsers: number; taskCompletions: number; flowCompletions: number }>> {
    const days = filters?.startDate && filters?.endDate
      ? Math.ceil((new Date(filters.endDate).getTime() - new Date(filters.startDate).getTime()) / (1000 * 60 * 60 * 24))
      : 30;
    
    const trends: Array<{ date: string; activeUsers: number; taskCompletions: number; flowCompletions: number }> = [];
    const startDate = filters?.startDate ? new Date(filters.startDate) : new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [activeUsers, taskCompletions, flowCompletions] = await Promise.all([
        prisma.user.count({
          where: {
            companyId,
            OR: [
              {
                completedTasks: {
                  some: {
                    createdAt: { gte: date, lt: nextDate },
                  },
                },
              },
              {
                initiatedFlows: {
                  some: {
                    startedAt: { gte: date, lt: nextDate },
                  },
                },
              },
            ],
          },
        }),
        prisma.taskExecution.count({
          where: {
            task: { companyId },
            status: 'COMPLETED',
            completedAt: { gte: date, lt: nextDate },
            ...(filters?.userId ? { executorId: filters.userId } : {}),
          },
        }),
        prisma.flowInstance.count({
          where: {
            flow: { companyId },
            status: 'COMPLETED',
            completedAt: { gte: date, lt: nextDate },
            ...(filters?.userId ? { initiatorId: filters.userId } : {}),
          },
        }),
      ]);

      trends.push({
        date: date.toISOString().split('T')[0],
        activeUsers,
        taskCompletions,
        flowCompletions,
      });
    }

    return trends;
  }

  private async getActivityByDepartment(companyId: string, filters?: AnalyticsFilters): Promise<Array<{ departmentId: string; departmentName: string; userCount: number; taskCompletions: number; flowCompletions: number }>> {
    const departments = await prisma.department.findMany({
      where: { companyId },
    });

    return Promise.all(
      departments.map(async (dept) => {
        // Cannot accurately calculate without department relation on User
        const userCount = 0;
        const taskCompletions = 0;
        const flowCompletions = 0;
        return {
          departmentId: dept.id,
          departmentName: dept.name,
          userCount,
          taskCompletions,
          flowCompletions,
        };
      })
    );
  }

  private async getActivityByRole(companyId: string, filters?: AnalyticsFilters): Promise<Array<{ roleId: string; roleName: string; userCount: number; taskCompletions: number; flowCompletions: number }>> {
    const roles = await prisma.role.findMany({
      where: { companyId },
    });

    return Promise.all(
      roles.map(async (role) => {
        // Count users by matching role name to UserRole enum
        const userCount = await prisma.user.count({
          where: {
            companyId,
            role: role.name as any, // Match if role name matches UserRole enum
            ...(filters?.startDate || filters?.endDate ? {
              completedTasks: {
                some: {
                  createdAt: {
                    ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
                    ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
                  },
                },
              },
            } : {}),
          },
        });
        // Cannot accurately filter by roleId since users don't have roleId relation
        const taskCompletions = 0;
        const flowCompletions = 0;
        return {
          roleId: role.id,
          roleName: role.name,
          userCount,
          taskCompletions,
          flowCompletions,
        };
      })
    );
  }

  private async getUserGrowth(companyId: string, days: number): Promise<Array<{ date: string; newUsers: number; totalUsers: number }>> {
    const trends: Array<{ date: string; newUsers: number; totalUsers: number }> = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [newUsers, totalUsers] = await Promise.all([
        prisma.user.count({
          where: {
            companyId,
            createdAt: { gte: date, lt: nextDate },
          },
        }),
        prisma.user.count({
          where: {
            companyId,
            createdAt: { lte: nextDate },
          },
        }),
      ]);

      trends.push({
        date: date.toISOString().split('T')[0],
        newUsers,
        totalUsers,
      });
    }

    return trends;
  }

  private async getPerformanceTrends(companyId: string, days: number): Promise<Array<{ date: string; averageTaskTime: number; averageFlowTime: number; completionRate: number }>> {
    const trends: Array<{ date: string; averageTaskTime: number; averageFlowTime: number; completionRate: number }> = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [completedTasks, completedFlows, totalTasks, totalFlows] = await Promise.all([
        prisma.taskExecution.findMany({
          where: {
            task: { companyId },
            status: 'COMPLETED',
            completedAt: { gte: date, lt: nextDate },
          },
          select: {
            createdAt: true,
            completedAt: true,
          },
        }),
        prisma.flowInstance.findMany({
          where: {
            flow: { companyId },
            status: 'COMPLETED',
            completedAt: { gte: date, lt: nextDate },
          },
          select: {
            startedAt: true,
            completedAt: true,
          },
        }),
        prisma.taskExecution.count({
          where: {
            task: { companyId },
            createdAt: { gte: date, lt: nextDate },
          },
        }),
        prisma.flowInstance.count({
          where: {
            flow: { companyId },
            startedAt: { gte: date, lt: nextDate },
          },
        }),
      ]);

      const validTasks = completedTasks.filter(
        task => task.completedAt !== null && task.createdAt !== null
      );
      const averageTaskTime = validTasks.length > 0
        ? validTasks.reduce((sum, task) => {
            const timeDiff = task.completedAt!.getTime() - task.createdAt!.getTime();
            return sum + (timeDiff / (1000 * 60 * 60));
          }, 0) / validTasks.length
        : 0;

      const validFlows = completedFlows.filter(
        flow => flow.completedAt !== null && flow.startedAt !== null
      );
      const averageFlowTime = validFlows.length > 0
        ? validFlows.reduce((sum, flow) => {
            const timeDiff = flow.completedAt!.getTime() - flow.startedAt!.getTime();
            return sum + (timeDiff / (1000 * 60 * 60));
          }, 0) / validFlows.length
        : 0;

      const completionRate = totalTasks > 0
        ? (completedTasks.length / totalTasks) * 100
        : 0;

      trends.push({
        date: date.toISOString().split('T')[0],
        averageTaskTime,
        averageFlowTime,
        completionRate,
      });
    }

    return trends;
  }

  private async getPeakActivityHours(companyId: string): Promise<Array<{ hour: number; activityCount: number }>> {
    const hours: Array<{ hour: number; activityCount: number }> = [];
    
    for (let hour = 0; hour < 24; hour++) {
      const count = await prisma.taskExecution.count({
        where: {
          task: { companyId },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      });
      
      // Simple hour-based filtering (would need more sophisticated query in production)
      hours.push({
        hour,
        activityCount: Math.floor(count / 24), // Simplified distribution
      });
    }

    return hours;
  }
}

export const analyticsService = new AnalyticsService();

