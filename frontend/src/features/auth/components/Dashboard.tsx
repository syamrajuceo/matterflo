import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function Dashboard() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            Welcome, {user?.firstName || user?.email}!
          </h1>
          <Button
            variant="destructive"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-200">
            <p>
              <span className="font-medium text-slate-300">Email:</span>{' '}
              {user?.email}
            </p>
            <p>
              <span className="font-medium text-slate-300">Role:</span>{' '}
              {user?.role}
            </p>
            {user?.companyId && (
              <p>
                <span className="font-medium text-slate-300">Company ID:</span>{' '}
                {user.companyId}
              </p>
            )}
            <p className="pt-4 text-xs text-slate-400 italic">
              Your admin dashboard content will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

