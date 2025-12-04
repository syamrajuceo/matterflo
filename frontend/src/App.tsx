import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './features/auth/store/authStore';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

// Layouts
import MainLayout from './layouts/MainLayout';
import ClientLayout from './layouts/ClientLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages
import LoginForm from './features/auth/components/LoginForm';
import { RegisterForm } from './features/auth/components/RegisterForm';

// Developer Pages
import MainDashboard from './features/dashboard/components/MainDashboard';
import TaskList from './features/task-builder/components/TaskList';
import { TaskBuilder } from './features/task-builder/components/TaskBuilder';
import FlowList from './features/flow-builder/components/FlowList';
import { FlowBuilder } from './features/flow-builder/components/FlowBuilder';
import TriggerList from './features/trigger-builder/components/TriggerList';
import { DatabaseBuilder } from './features/database-builder/components/DatabaseBuilder';
import { DatasetBuilder } from './features/dataset-builder/components/DatasetBuilder';
import { CompanyHierarchy } from './features/company/components/CompanyHierarchy';
import { IntegrationsList } from './features/integrations/components/IntegrationsList';
import { AuditLogs } from './features/audit-logs/components/AuditLogs';
import UserManagement from './features/users/components/UserManagement';

// Client Pages
import { ClientDashboard } from './features/client-portal/components/ClientDashboard';
import { TaskCompletion } from './features/client-portal/components/TaskCompletion';
import { FlowTracking } from './features/client-portal/components/FlowTracking';

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
    <ErrorBoundary>
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
            <Route path="/database/new" element={<DatabaseBuilder />} />
            <Route path="/database/:tableId" element={<DatabaseBuilder />} />
            <Route path="/database/:tableId/records" element={<DatabaseBuilder />} />
            
            {/* Dataset Routes */}
            <Route path="/datasets" element={<MainDashboard />} />
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

            {/* Settings */}
            <Route path="/settings" element={<MainDashboard />} />
            <Route path="/profile" element={<MainDashboard />} />
          </Route>

          {/* Protected Client Routes */}
          <Route element={<ProtectedRoute><ClientLayout /></ProtectedRoute>}>
            <Route path="/client" element={<Navigate to="/client/dashboard" replace />} />
            <Route path="/client/dashboard" element={<ClientDashboard />} />
            <Route path="/client/tasks" element={<ClientDashboard />} />
            <Route path="/client/tasks/:id/complete" element={<TaskCompletion />} />
            <Route path="/client/flows" element={<ClientDashboard />} />
            <Route path="/client/flows/:id" element={<FlowTracking />} />
          </Route>

          {/* 404 Redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
