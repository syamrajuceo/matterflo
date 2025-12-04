import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Zap, Edit, Play } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface Trigger {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  eventType: string;
  createdAt: string;
}

export default function TriggerList() {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTriggers();
  }, []);

  const fetchTriggers = async () => {
    try {
      const response = await axios.get('/triggers');
      // Backend returns { success: true, data: { triggers: [], total: number } }
      setTriggers(response.data.data?.triggers || response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch triggers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" label="Loading triggers..." className="py-12" />;
  }

  if (triggers.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          icon={Zap}
          title="No triggers yet"
          description="Create your first trigger to automate business processes based on events."
          actionLabel="View Flows"
          onAction={() => window.location.href = '/flows'}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Triggers</h1>
          <p className="text-muted-foreground">
            Automate actions based on events and conditions
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {triggers.map((trigger) => (
          <Card key={trigger.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{trigger.name}</CardTitle>
                  <CardDescription className="mt-1.5">
                    {trigger.description || 'No description'}
                  </CardDescription>
                </div>
                <Badge variant={trigger.isActive ? 'default' : 'secondary'}>
                  {trigger.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Play className="h-3 w-3" />
                  <span>{trigger.eventType.replace('_', ' ')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

