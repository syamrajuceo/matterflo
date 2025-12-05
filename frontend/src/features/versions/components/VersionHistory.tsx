import { useState, useEffect } from 'react';
import { versionService } from '../services/version.service';
import type { IVersion } from '../services/version.service';
import { VersionComparison } from './VersionComparison';
import { RolloutManager } from './RolloutManager';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { History, Eye, RotateCcw, Rocket, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useParams } from 'react-router-dom';

interface VersionHistoryProps {
  entityType: 'Task' | 'Flow' | 'Dataset' | 'CustomTable';
  entityId: string;
}

export function VersionHistory({ entityType, entityId }: VersionHistoryProps) {
  const [versions, setVersions] = useState<IVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<IVersion | null>(null);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [isRolloutOpen, setIsRolloutOpen] = useState(false);
  const [rollbackVersionId, setRollbackVersionId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadVersions();
  }, [entityType, entityId]);

  const loadVersions = async () => {
    try {
      setIsLoading(true);
      const data = await versionService.getVersionHistory(entityType, entityId);
      setVersions(data);
    } catch (error) {
      console.error('Failed to load version history', error);
      showToast({
        title: 'Failed to load versions',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async (versionId: string) => {
    try {
      await versionService.publishVersion(versionId);
      showToast({
        title: 'Version published',
        description: 'Version has been published successfully',
        status: 'success',
      });
      loadVersions();
    } catch (error) {
      console.error('Failed to publish version', error);
      showToast({
        title: 'Failed to publish',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
      });
    }
  };

  const handleRollback = async (versionId: string) => {
    try {
      await versionService.rollbackVersion(versionId);
      showToast({
        title: 'Rollback successful',
        description: 'Version has been rolled back successfully',
        status: 'success',
      });
      loadVersions();
      setRollbackVersionId(null);
    } catch (error) {
      console.error('Failed to rollback version', error);
      showToast({
        title: 'Failed to rollback',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
      });
    }
  };

  const getStatusBadge = (status: IVersion['status']) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      DRAFT: 'secondary',
      PUBLISHED: 'default',
      STABLE: 'default',
      DEPRECATED: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading version history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Version History</h2>
        </div>
        <Button onClick={loadVersions} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {versions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No versions found</p>
          <p className="text-sm mt-1">Create a version to track changes</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rollout</TableHead>
              <TableHead>Changes</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map((version) => (
              <TableRow key={version.id}>
                <TableCell className="font-medium">v{version.version}</TableCell>
                <TableCell>{getStatusBadge(version.status)}</TableCell>
                <TableCell>
                  {version.status === 'PUBLISHED' ? (
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${version.rolloutPercentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {version.rolloutPercentage}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="max-w-md truncate">
                  {version.changes || 'No changes specified'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(version.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {version.publishedAt
                    ? new Date(version.publishedAt).toLocaleDateString()
                    : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedVersion(version);
                          setIsComparisonOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {version.status === 'DRAFT' && (
                        <DropdownMenuItem onClick={() => handlePublish(version.id)}>
                          <Rocket className="h-4 w-4 mr-2" />
                          Publish
                        </DropdownMenuItem>
                      )}
                      {version.status === 'PUBLISHED' && (
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedVersion(version);
                            setIsRolloutOpen(true);
                          }}
                        >
                          <Rocket className="h-4 w-4 mr-2" />
                          Manage Rollout
                        </DropdownMenuItem>
                      )}
                      {version.status !== 'DRAFT' && (
                        <DropdownMenuItem
                          onClick={() => setRollbackVersionId(version.id)}
                          className="text-destructive"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Rollback
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Version Comparison Dialog */}
      {selectedVersion && (
        <VersionComparison
          version={selectedVersion}
          isOpen={isComparisonOpen}
          onClose={() => {
            setIsComparisonOpen(false);
            setSelectedVersion(null);
          }}
        />
      )}

      {/* Rollout Manager Dialog */}
      {selectedVersion && selectedVersion.status === 'PUBLISHED' && (
        <RolloutManager
          version={selectedVersion}
          isOpen={isRolloutOpen}
          onClose={() => {
            setIsRolloutOpen(false);
            setSelectedVersion(null);
          }}
          onUpdated={loadVersions}
        />
      )}

      {/* Rollback Confirmation */}
      <AlertDialog
        open={rollbackVersionId !== null}
        onOpenChange={(open) => !open && setRollbackVersionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rollback Version</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to rollback to this version? This will restore the entity to
              the state captured in this version snapshot. A new version will be created to
              document the rollback.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => rollbackVersionId && handleRollback(rollbackVersionId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Rollback
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

