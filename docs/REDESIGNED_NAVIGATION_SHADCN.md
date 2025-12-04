# REDESIGNED NAVIGATION SYSTEM
# Left Sidebar + shadcn/ui Components

**Design System:** shadcn/ui components and color scheme  
**Layout:** Collapsible left sidebar with hamburger menu

---

## 🎨 SHADCN COLOR SCHEME

```typescript
// This is the default shadcn/ui color scheme we'll use

colors: {
  background: "hsl(var(--background))",     // Main background
  foreground: "hsl(var(--foreground))",     // Main text
  card: "hsl(var(--card))",                 // Card backgrounds
  'card-foreground': "hsl(var(--card-foreground))",
  popover: "hsl(var(--popover))",
  'popover-foreground': "hsl(var(--popover-foreground))",
  primary: "hsl(var(--primary))",           // Primary buttons
  'primary-foreground': "hsl(var(--primary-foreground))",
  secondary: "hsl(var(--secondary))",       // Secondary buttons
  'secondary-foreground': "hsl(var(--secondary-foreground))",
  muted: "hsl(var(--muted))",              // Muted backgrounds
  'muted-foreground': "hsl(var(--muted-foreground))",
  accent: "hsl(var(--accent))",            // Accent highlights
  'accent-foreground': "hsl(var(--accent-foreground))",
  destructive: "hsl(var(--destructive))",  // Delete/danger buttons
  'destructive-foreground': "hsl(var(--destructive-foreground))",
  border: "hsl(var(--border))",            // Borders
  input: "hsl(var(--input))",              // Input borders
  ring: "hsl(var(--ring))",                // Focus rings
}

// Use these CSS variables throughout - shadcn automatically provides them
```

---

## PROMPT 1: App Router with Sidebar Layout

```
Set up complete routing with left sidebar layout using shadcn/ui.

IMPORTANT: Make sure shadcn/ui is installed and configured:
npx shadcn-ui@latest init

Install required shadcn components:
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add separator

Update: frontend/src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './features/auth/store/authStore';

// Layouts
import MainLayout from './layouts/MainLayout';
import ClientLayout from './layouts/ClientLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages
import LoginForm from './features/auth/components/LoginForm';
import RegisterForm from './features/auth/components/RegisterForm';

// Developer Pages
import MainDashboard from './features/dashboard/components/MainDashboard';
import TaskBuilder from './features/task-builder/components/TaskBuilder';
import TaskList from './features/task-builder/components/TaskList';
import FlowBuilder from './features/flow-builder/components/FlowBuilder';
import FlowList from './features/flow-builder/components/FlowList';
import TriggerList from './features/trigger-builder/components/TriggerList';
import DatabaseBuilder from './features/database-builder/components/DatabaseBuilder';
import DatasetBuilder from './features/dataset-builder/components/DatasetBuilder';
import DatasetList from './features/dataset-builder/components/DatasetList';
import CompanyHierarchy from './features/company/components/CompanyHierarchy';
import IntegrationsList from './features/integrations/components/IntegrationsList';
import AuditLogs from './features/audit-logs/components/AuditLogs';
import UserManagement from './features/users/components/UserManagement';

// Client Pages
import ClientDashboard from './features/client-portal/components/ClientDashboard';
import ClientTasks from './features/client-portal/components/ClientTasks';
import TaskCompletion from './features/client-portal/components/TaskCompletion';
import ClientFlows from './features/client-portal/components/ClientFlows';
import FlowTracking from './features/client-portal/components/FlowTracking';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
        </Route>

        {/* Protected Developer Routes */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<MainDashboard />} />
          
          {/* Task Routes */}
          <Route path="/tasks" element={<TaskList />} />
          <Route path="/tasks/new" element={<TaskBuilder />} />
          <Route path="/tasks/:id" element={<TaskBuilder />} />
          
          {/* Flow Routes */}
          <Route path="/flows" element={<FlowList />} />
          <Route path="/flows/new" element={<FlowBuilder />} />
          <Route path="/flows/:id" element={<FlowBuilder />} />
          
          {/* Trigger Routes */}
          <Route path="/triggers" element={<TriggerList />} />
          
          {/* Database Routes */}
          <Route path="/database" element={<DatabaseBuilder />} />
          <Route path="/database/tables/:tableId" element={<DatabaseBuilder />} />
          
          {/* Dataset Routes */}
          <Route path="/datasets" element={<DatasetList />} />
          <Route path="/datasets/new" element={<DatasetBuilder />} />
          <Route path="/datasets/:id" element={<DatasetBuilder />} />
          
          {/* Company Routes */}
          <Route path="/company" element={<CompanyHierarchy />} />
          
          {/* Integration Routes */}
          <Route path="/integrations" element={<IntegrationsList />} />
          
          {/* Audit Routes */}
          <Route path="/audit-logs" element={<AuditLogs />} />
          
          {/* User Routes */}
          <Route path="/users" element={<UserManagement />} />
        </Route>

        {/* Protected Client Routes */}
        <Route element={<ProtectedRoute><ClientLayout /></ProtectedRoute>}>
          <Route path="/client" element={<Navigate to="/client/dashboard" replace />} />
          <Route path="/client/dashboard" element={<ClientDashboard />} />
          <Route path="/client/tasks" element={<ClientTasks />} />
          <Route path="/client/tasks/:id/complete" element={<TaskCompletion />} />
          <Route path="/client/flows" element={<ClientFlows />} />
          <Route path="/client/flows/:id" element={<FlowTracking />} />
        </Route>

        {/* 404 Redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## PROMPT 2: Main Layout with Collapsible Sidebar (shadcn/ui)

```
Create the main layout with collapsible left sidebar using shadcn/ui components.

Create: frontend/src/layouts/MainLayout.tsx

import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../features/auth/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Home,
  FileText,
  Workflow,
  Zap,
  Database,
  BarChart3,
  Building2,
  Plug,
  ScrollText,
  Users,
  Settings,
  LogOut,
  Menu,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', path: '/dashboard', icon: Home },
  { name: 'Tasks', path: '/tasks', icon: FileText },
  { name: 'Flows', path: '/flows', icon: Workflow },
  { name: 'Triggers', path: '/triggers', icon: Zap },
  { name: 'Database', path: '/database', icon: Database },
  { name: 'Datasets', path: '/datasets', icon: BarChart3 },
  { name: 'Company', path: '/company', icon: Building2 },
  { name: 'Integrations', path: '/integrations', icon: Plug },
  { name: 'Audit Logs', path: '/audit-logs', icon: ScrollText },
  { name: 'Users', path: '/users', icon: Users },
];

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } flex flex-col border-r bg-card transition-all duration-300 ease-in-out`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {sidebarOpen ? (
            <>
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  🏗️
                </div>
                <span className="text-lg font-bold">ERP Builder</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={`w-full justify-start ${!sidebarOpen && 'justify-center'}`}
                >
                  <Icon className={`h-4 w-4 ${sidebarOpen && 'mr-2'}`} />
                  {sidebarOpen && <span>{item.name}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>

        <Separator />

        {/* Sidebar Footer */}
        <div className="p-2 space-y-1">
          <Button
            variant="ghost"
            className={`w-full justify-start ${!sidebarOpen && 'justify-center'}`}
            onClick={() => navigate('/settings')}
          >
            <Settings className={`h-4 w-4 ${sidebarOpen && 'mr-2'}`} />
            {sidebarOpen && <span>Settings</span>}
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start ${!sidebarOpen && 'justify-center'}`}
            onClick={handleLogout}
          >
            <LogOut className={`h-4 w-4 ${sidebarOpen && 'mr-2'}`} />
            {sidebarOpen && <span>Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <div className="flex flex-1 items-center space-x-4">
            {/* Search Bar */}
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                3
              </Badge>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {getInitials(user?.firstName, user?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user?.role}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

This creates:
- Collapsible sidebar (240px expanded, 64px collapsed)
- Smooth animations
- Active state highlighting
- Search bar in header
- Notification badge
- User dropdown menu
- All using shadcn/ui components
```

---

## PROMPT 3: Main Dashboard with shadcn/ui Cards

```
Create the main dashboard using shadcn/ui Card components.

Create: frontend/src/features/dashboard/components/MainDashboard.tsx

import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Workflow,
  Zap,
  Database,
  BarChart3,
  Building2,
  Plug,
  ScrollText,
  Users,
  Plus,
  ArrowRight,
  TrendingUp,
  Activity,
} from 'lucide-react';

interface Stats {
  tasks: number;
  flows: number;
  triggers: number;
  tables: number;
}

interface Activity {
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
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tasksRes, flowsRes, triggersRes, tablesRes] = await Promise.all([
        axios.get('/api/tasks'),
        axios.get('/api/flows'),
        axios.get('/api/triggers'),
        axios.get('/api/database/tables')
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

  const features = [
    {
      name: 'Task Builder',
      description: 'Create custom forms and data collection',
      icon: FileText,
      path: '/tasks',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      name: 'Flow Builder',
      description: 'Design multi-step workflows',
      icon: Workflow,
      path: '/flows',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      name: 'Triggers',
      description: 'Automate with business rules',
      icon: Zap,
      path: '/triggers',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    {
      name: 'Database',
      description: 'Create custom tables and data',
      icon: Database,
      path: '/database',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      name: 'Datasets',
      description: 'Build dashboards and reports',
      icon: BarChart3,
      path: '/datasets',
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10'
    },
    {
      name: 'Company',
      description: 'Manage hierarchy and roles',
      icon: Building2,
      path: '/company',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10'
    },
    {
      name: 'Integrations',
      description: 'Connect external services',
      icon: Plug,
      path: '/integrations',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    {
      name: 'Audit Logs',
      description: 'Track all system activities',
      icon: ScrollText,
      path: '/audit-logs',
      color: 'text-gray-500',
      bgColor: 'bg-gray-500/10'
    },
    {
      name: 'Users',
      description: 'Manage team members',
      icon: Users,
      path: '/users',
      color: 'text-teal-500',
      bgColor: 'bg-teal-500/10'
    }
  ];

  const statCards = [
    { label: 'Tasks', value: stats.tasks, icon: FileText, trend: '+12%', color: 'text-blue-500' },
    { label: 'Flows', value: stats.flows, icon: Workflow, trend: '+8%', color: 'text-purple-500' },
    { label: 'Triggers', value: stats.triggers, icon: Zap, trend: '+15%', color: 'text-yellow-500' },
    { label: 'Tables', value: stats.tables, icon: Database, trend: '+5%', color: 'text-green-500' }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back! 👋
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your ERP system today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  <span className="text-green-500">{stat.trend}</span>
                  <span className="ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started by creating new items
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/tasks/new">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/flows/new">
              <Plus className="mr-2 h-4 w-4" />
              New Flow
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/database">
              <Plus className="mr-2 h-4 w-4" />
              New Table
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/datasets/new">
              <Plus className="mr-2 h-4 w-4" />
              New Dataset
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* All Features Grid */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">
          All Features
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.name} to={feature.path}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${feature.bgColor}`}>
                        <Icon className={`h-6 w-6 ${feature.color}`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{feature.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {feature.description}
                        </CardDescription>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest updates from your ERP system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4">
                <div className={`flex h-2 w-2 translate-y-1 rounded-full ${
                  activity.type === 'success' ? 'bg-green-500' :
                  activity.type === 'warning' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`} />
                <div className="flex-1 space-y-1">
                  <p className="text-sm">{activity.message}</p>
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

This creates a beautiful dashboard using:
- shadcn/ui Card components
- Proper semantic colors
- Hover effects
- Trend indicators
- Activity feed
- Grid layout
```

---

## PROMPT 4: Client Portal Layout (shadcn/ui)

```
Create simplified client portal layout using shadcn/ui.

Create: frontend/src/layouts/ClientLayout.tsx

import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../features/auth/store/authStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Home, FileText, Workflow, LogOut } from 'lucide-react';

const clientNavigation = [
  { name: 'Dashboard', path: '/client/dashboard', icon: Home },
  { name: 'My Tasks', path: '/client/tasks', icon: FileText },
  { name: 'My Flows', path: '/client/flows', icon: Workflow },
];

export default function ClientLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Simple Top Navigation for Clients */}
      <header className="sticky top-0 z-50 w-full border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          {/* Company Logo */}
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              🏢
            </div>
            <span className="text-lg font-semibold">Acme Corp</span>
          </div>

          {/* Simple Navigation */}
          <nav className="flex items-center space-x-1">
            {clientNavigation.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className="justify-start"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {getInitials(user?.firstName, user?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Page Content */}
      <main className="container flex-1 py-8">
        <Outlet />
      </main>
    </div>
  );
}

This creates a clean, simple layout for client users with:
- Company branding
- Simple 3-tab navigation
- User dropdown
- No access to admin features
```

---

## PROMPT 5: Auth Layout (Login/Register) with shadcn/ui

```
Create authentication pages using shadcn/ui form components.

Create: frontend/src/layouts/AuthLayout.tsx

import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthLayout() {
  const { token } = useAuthStore();

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-4xl">
            🏗️
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            ERP Builder
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Build your business processes without coding
          </p>
        </div>

        {/* Auth Card */}
        <Card>
          <Outlet />
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          © 2024 ERP Builder. All rights reserved.
        </p>
      </div>
    </div>
  );
}

Update: frontend/src/features/auth/components/LoginForm.tsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export default function LoginForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.response?.data?.error?.message || 'Invalid credentials',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>
          Enter your credentials to access your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={formData.remember}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, remember: checked as boolean })
              }
            />
            <Label
              htmlFor="remember"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Remember me
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Login
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Register
            </Link>
          </p>
        </form>
      </CardContent>
    </>
  );
}

This creates:
- Clean auth pages with shadcn/ui forms
- Proper form validation
- Loading states
- Error handling with toasts
- Responsive design
```

---

## 🎨 SHADCN THEME CONFIGURATION

```
Make sure your shadcn theme is configured properly.

Update: frontend/src/app/globals.css (or similar)

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

Enable dark mode by default in your app:

Update: frontend/src/main.tsx or App.tsx

// Add this to enable dark mode
document.documentElement.classList.add('dark');
```

---

## ✅ IMPLEMENTATION CHECKLIST

### Step 1: Install shadcn/ui (5 min)
```bash
cd frontend
npx shadcn-ui@latest init
# Select: Default style, Slate color, CSS variables

# Install all required components
npx shadcn-ui@latest add button card input label select table badge avatar dropdown-menu separator sheet dialog
```

### Step 2: Update App.tsx (2 min)
```bash
# Copy PROMPT 1 to Cursor
# Replace App.tsx content
```

### Step 3: Create MainLayout (5 min)
```bash
# Copy PROMPT 2 to Cursor
# Create layouts/MainLayout.tsx
```

### Step 4: Create Dashboard (5 min)
```bash
# Copy PROMPT 3 to Cursor
# Create dashboard/MainDashboard.tsx
```

### Step 5: Create Client & Auth Layouts (5 min)
```bash
# Copy PROMPT 4 to Cursor (ClientLayout)
# Copy PROMPT 5 to Cursor (AuthLayout + LoginForm)
```

### Step 6: Enable Dark Mode (1 min)
```bash
# Update globals.css and enable dark mode
```

---

## 🎯 RESULT

After implementing all prompts, you'll have:

✅ **Collapsible left sidebar** (240px ↔ 64px)  
✅ **shadcn/ui components** throughout  
✅ **Dark theme** by default  
✅ **Smooth animations** on everything  
✅ **Professional design** that matches shadcn  
✅ **Fully navigable** - click to go anywhere  
✅ **Responsive** - works on mobile/tablet/desktop  
✅ **Icons from lucide-react** (included with shadcn)  

---

## 📱 VISUAL COMPARISON

**Before:** Manual URL typing, no navigation  
**After:** Click anywhere, beautiful sidebar, professional UI

**Your app will look exactly like shadcn documentation** - same quality, same polish!

---

Ready to implement? Start with Step 1 (install shadcn/ui) and work through each prompt!
