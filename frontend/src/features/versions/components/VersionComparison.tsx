import type { IVersion } from '../services/version.service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { GitCompare, Calendar, User } from 'lucide-react';

interface VersionComparisonProps {
  version: IVersion;
  isOpen: boolean;
  onClose: () => void;
}

export function VersionComparison({
  version,
  isOpen,
  onClose,
}: VersionComparisonProps) {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Version {version.version} Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Version Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Version</div>
              <div className="text-lg font-semibold">v{version.version}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
              <div>{getStatusBadge(version.status)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Entity Type</div>
              <div className="text-sm">{version.entityType}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Entity ID</div>
              <div className="text-sm font-mono text-xs">{version.entityId}</div>
            </div>
          </div>

          <Separator />

          {/* Changes */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Changes</div>
            <div className="p-3 bg-muted rounded-lg">
              {version.changes || 'No changes specified'}
            </div>
          </div>

          {/* Rollout Info */}
          {version.status === 'PUBLISHED' && (
            <>
              <Separator />
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Rollout Status
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Rollout Percentage</span>
                    <span className="font-medium">{version.rolloutPercentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${version.rolloutPercentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Deployed to {version.deployedToClients.length} company/companies
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Timestamps */}
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Created</div>
                <div className="text-sm">
                  {new Date(version.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
            {version.publishedAt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Published</div>
                  <div className="text-sm">
                    {new Date(version.publishedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Snapshot Preview */}
          <Separator />
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Snapshot Preview
            </div>
            <div className="p-3 bg-muted rounded-lg max-h-64 overflow-auto">
              <pre className="text-xs">
                {JSON.stringify(version.snapshot, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

