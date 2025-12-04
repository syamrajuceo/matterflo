import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Workflow, Edit, Layers } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface Flow {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  levels?: any[];
}

export default function FlowList() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlows();
  }, []);

  const fetchFlows = async () => {
    try {
      const response = await axios.get('/flows');
      setFlows(response.data.data.flows || []);
    } catch (error) {
      console.error('Failed to fetch flows:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" label="Loading flows..." className="py-12" />;
  }

  if (flows.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          icon={Workflow}
          title="No flows yet"
          description="Create your first workflow to automate multi-step business processes."
          actionLabel="Create Flow"
          onAction={() => window.location.href = '/flows/new'}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Flows</h1>
          <p className="text-muted-foreground">
            Design and manage multi-step workflows
          </p>
        </div>
        <Button asChild size="default">
          <Link to="/flows/new">
            <Plus className="size-4" />
            New Flow
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {flows.map((flow) => (
          <Card key={flow.id} className="group hover:shadow-lg hover:border-border transition-all duration-200">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <CardTitle className="text-base group-hover:text-primary transition-colors">{flow.name}</CardTitle>
                  <CardDescription>
                    {flow.description || 'No description'}
                  </CardDescription>
                </div>
                <Badge variant={flow.status === 'PUBLISHED' ? 'default' : 'secondary'} className="shrink-0">
                  {flow.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Layers className="size-3.5" />
                  <span>{flow.levels?.length || 0} levels</span>
                </div>
                <Button variant="ghost" size="icon-sm" asChild>
                  <Link to={`/flows/${flow.id}`}>
                    <Edit className="size-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
