import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Workflow, Edit, Layers, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { flowService } from '../services/flow.service';
import { useToast } from '@/components/ui/use-toast';
import { useRole } from '@/hooks/useRole';

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [flowToDelete, setFlowToDelete] = useState<Flow | null>(null);
  const { showToast } = useToast();
  const { isDeveloper } = useRole();

  useEffect(() => {
    fetchFlows();
  }, []);

  // Debug: Log role in development
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[FlowList Debug]', { isDeveloper });
    }
  }, [isDeveloper]);

  const fetchFlows = async () => {
    try {
      const response = await axios.get('/flows');
      const allFlows = response.data.data.flows || [];
      // Filter out archived flows from the display
      const activeFlows = allFlows.filter((flow: Flow) => flow.status !== 'ARCHIVED');
      setFlows(activeFlows);
      console.log('[FlowList] Fetched flows:', { total: allFlows.length, active: activeFlows.length, archived: allFlows.length - activeFlows.length });
    } catch (error) {
      console.error('Failed to fetch flows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, flow: Flow) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[FlowList] Delete button clicked for flow:', flow.name);
    setFlowToDelete(flow);
    setDeleteDialogOpen(true);
    console.log('[FlowList] Dialog state set to open');
  };

  const handleDeleteConfirm = async () => {
    if (!flowToDelete) {
      console.error('[FlowList] No flow to delete');
      return;
    }

    console.log('[FlowList] Confirming deletion of flow:', flowToDelete.name);
    try {
      await flowService.deleteFlow(flowToDelete.id);
      console.log('[FlowList] Flow deleted successfully');
      
      // Immediately remove the flow from the UI (optimistic update)
      setFlows((prevFlows) => prevFlows.filter((flow) => flow.id !== flowToDelete.id));
      
      showToast({
        title: 'Flow deleted',
        description: `"${flowToDelete.name}" has been deleted successfully.`,
        status: 'success',
      });
      
      // Close dialog
      setDeleteDialogOpen(false);
      setFlowToDelete(null);
      
      // Optionally refresh to ensure sync (but UI is already updated)
      // await fetchFlows();
    } catch (error: any) {
      console.error('[FlowList] Failed to delete flow:', error);
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to delete flow';
      showToast({
        title: 'Failed to delete flow',
        description: errorMessage,
        status: 'error',
      });
      // Refresh on error to ensure UI is in sync
      await fetchFlows();
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
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-sm" asChild>
                    <Link to={`/flows/${flow.id}`}>
                      <Edit className="size-4" />
                    </Link>
                  </Button>
                  {isDeveloper && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => handleDeleteClick(e, flow)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Delete flow"
                      type="button"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        console.log('[FlowList] Dialog open state changed:', open);
        setDeleteDialogOpen(open);
        if (!open) {
          setFlowToDelete(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Flow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{flowToDelete?.name}"? This action cannot be undone. The flow will be archived.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                console.log('[FlowList] Cancel clicked');
                setDeleteDialogOpen(false);
                setFlowToDelete(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                console.log('[FlowList] Delete action clicked');
                handleDeleteConfirm();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
