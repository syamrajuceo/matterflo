import { useAuditStore } from '../store/auditStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const getLevelColor = (level: string) => {
  switch (level) {
    case 'INFO':
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30';
    case 'WARN':
      return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30';
    case 'ERROR':
      return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30';
    case 'CRITICAL':
      return 'bg-red-900/20 text-red-900 dark:text-red-300 border-red-900/40';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export function LogDetails() {
  const { selectedLog, setSelectedLog } = useAuditStore();

  if (!selectedLog) return null;

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-sm">Log Details</DialogTitle>
          <DialogDescription className="text-xs">
            Complete information about this audit log entry
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 text-xs">
            <div>
              <div className="font-medium text-muted-foreground">Timestamp</div>
              <div className="mt-1">{formatDate(selectedLog.createdAt)}</div>
            </div>

            <Separator />

            <div>
              <div className="font-medium text-muted-foreground">User</div>
              <div className="mt-1">
                {selectedLog.user ? (
                  <div className="space-y-1">
                    <div>{selectedLog.user.name || selectedLog.user.email}</div>
                    <div className="text-muted-foreground">{selectedLog.user.email}</div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">System</span>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-medium text-muted-foreground">Action</div>
                <div className="mt-1 capitalize">{selectedLog.action}</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">Level</div>
                <div className="mt-1">
                  <Badge
                    variant="outline"
                    className={`h-5 border px-1.5 text-[9px] ${getLevelColor(selectedLog.level)}`}
                  >
                    {selectedLog.level}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-medium text-muted-foreground">Entity Type</div>
                <div className="mt-1">{selectedLog.entityType}</div>
              </div>
              {selectedLog.entityId && (
                <div>
                  <div className="font-medium text-muted-foreground">Entity ID</div>
                  <div className="mt-1 font-mono text-[10px]">{selectedLog.entityId}</div>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <div className="font-medium text-muted-foreground">Message</div>
              <div className="mt-1">{selectedLog.message}</div>
            </div>

            {selectedLog.changes && (
              <>
                <Separator />
                <div>
                  <div className="font-medium text-muted-foreground">Changes</div>
                  <div className="mt-2 space-y-2">
                    {selectedLog.changes.before && (
                      <div>
                        <div className="text-[10px] font-medium text-muted-foreground">Before:</div>
                        <pre className="mt-1 rounded border bg-muted/30 p-2 text-[10px] font-mono overflow-x-auto">
                          {JSON.stringify(selectedLog.changes.before, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedLog.changes.after && (
                      <div>
                        <div className="text-[10px] font-medium text-muted-foreground">After:</div>
                        <pre className="mt-1 rounded border bg-muted/30 p-2 text-[10px] font-mono overflow-x-auto">
                          {JSON.stringify(selectedLog.changes.after, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {selectedLog.metadata && (
              <>
                <Separator />
                <div>
                  <div className="font-medium text-muted-foreground">Metadata</div>
                  <div className="mt-2 space-y-1">
                    {selectedLog.metadata.ip && (
                      <div>
                        <span className="text-[10px] font-medium text-muted-foreground">IP:</span>{' '}
                        <span className="font-mono">{selectedLog.metadata.ip}</span>
                      </div>
                    )}
                    {selectedLog.metadata.userAgent && (
                      <div>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          User Agent:
                        </span>{' '}
                        <span className="font-mono text-[10px]">
                          {selectedLog.metadata.userAgent}
                        </span>
                      </div>
                    )}
                    {selectedLog.metadata.requestId && (
                      <div>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          Request ID:
                        </span>{' '}
                        <span className="font-mono text-[10px]">
                          {selectedLog.metadata.requestId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

