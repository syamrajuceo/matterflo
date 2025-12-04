import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/store/authStore';
import { Card } from '@/components/ui/card';

export default function AuthLayout() {
  const { token } = useAuthStore();

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-4xl shadow-lg">
            🏗️
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              ERP Builder
            </h1>
            <p className="text-sm text-muted-foreground">
              Build your business processes without coding
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="shadow-lg">
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

