import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Workflow,
  Zap,
  Database,
  Plus,
  TrendingUp,
  Activity,
} from 'lucide-react';

interface Stats {
  tasks: number;
  flows: number;
  triggers: number;
  tables: number;
}

interface ActivityItem {
  id: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning';
}

export default function MainDashboard() {
  const [stats, setStats] = useState<Stats>({
    tasks: 0,
    flows: 0,
    triggers: 0,
    tables: 0
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tasksRes, flowsRes, triggersRes, tablesRes] = await Promise.all([
        axios.get('/tasks').catch(() => ({ data: { data: { total: 0 } } })),
        axios.get('/flows').catch(() => ({ data: { data: { total: 0 } } })),
        axios.get('/triggers').catch(() => ({ data: { data: [] } })),
        axios.get('/database/tables').catch(() => ({ data: { data: [] } }))
      ]);

      setStats({
        tasks: tasksRes.data.data.total || 0,
        flows: flowsRes.data.data.total || 0,
        triggers: triggersRes.data.data.length || 0,
        tables: tablesRes.data.data.length || 0
      });

      // Mock activities - replace with real API call
      setActivities([
        {
          id: '1',
          message: 'John created "Employee Onboarding" task',
          time: '5 minutes ago',
          type: 'info'
        },
        {
          id: '2',
          message: 'Jane published "Expense Approval" flow',
          time: '15 minutes ago',
          type: 'success'
        },
        {
          id: '3',
          message: 'System executed trigger "High Value Alert"',
          time: '30 minutes ago',
          type: 'warning'
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Tasks', value: stats.tasks, icon: FileText, trend: '+12%', color: 'text-blue-500' },
    { label: 'Flows', value: stats.flows, icon: Workflow, trend: '+8%', color: 'text-purple-500' },
    { label: 'Triggers', value: stats.triggers, icon: Zap, trend: '+15%', color: 'text-yellow-500' },
    { label: 'Tables', value: stats.tables, icon: Database, trend: '+5%', color: 'text-green-500' }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back! 👋
        </h1>
        <p className="text-base text-muted-foreground">
          Here's what's happening with your ERP system today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="group hover:shadow-lg hover:border-border transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                  {stat.label}
                </CardTitle>
                <div className={`p-2.5 rounded-lg bg-${stat.color.split('-')[1]}-500/10 ${stat.color}`}>
                  <Icon className="size-5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="mr-1.5 size-3.5 text-green-600" />
                  <span className="font-semibold text-green-600">{stat.trend}</span>
                  <span className="ml-1.5">from last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-5">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>
            Get started by creating new items
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild size="default">
            <Link to="/tasks/new">
              <Plus className="size-4" />
              New Task
            </Link>
          </Button>
          <Button asChild variant="outline" size="default">
            <Link to="/flows/new">
              <Plus className="size-4" />
              New Flow
            </Link>
          </Button>
          <Button asChild variant="outline" size="default">
            <Link to="/database">
              <Plus className="size-4" />
              New Table
            </Link>
          </Button>
          <Button asChild variant="outline" size="default">
            <Link to="/datasets/new">
              <Plus className="size-4" />
              New Dataset
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-5">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Activity className="size-5" />
            </div>
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest updates from your ERP system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 pb-5 border-b border-border/50 last:border-0 last:pb-0">
                <div className={`flex size-2 translate-y-2 rounded-full ${
                  activity.type === 'success' ? 'bg-green-500' :
                  activity.type === 'warning' ? 'bg-yellow-500' :
                  'bg-blue-500'
                } ring-4 ring-${
                  activity.type === 'success' ? 'green' :
                  activity.type === 'warning' ? 'yellow' :
                  'blue'
                }-500/10`} />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-relaxed">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

