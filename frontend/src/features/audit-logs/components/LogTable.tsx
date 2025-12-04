import { useState } from 'react';
import type { IAuditLog } from '../services/audit.service';
import { useAuditStore } from '../store/auditStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { LogDetails } from './LogDetails';

const getLevelColor = (level: IAuditLog['level']) => {
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

const formatTimestamp = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

interface LogTableProps {
  logs: IAuditLog[];
}

export function LogTable({ logs }: LogTableProps) {
  const { setSelectedLog, filters, setFilters } = useAuditStore();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (column: string) => {
    let newSortOrder: 'asc' | 'desc' = 'desc';
    if (sortColumn === column) {
      newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newSortOrder);
    } else {
      setSortColumn(column);
      setSortOrder('desc');
      newSortOrder = 'desc';
    }
    setFilters({ sortBy: column, sortOrder: newSortOrder });
  };

  const toggleRow = (logId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedRows(newExpanded);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="ml-1 h-3 w-3" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3" />
    );
  };

  if (logs.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border bg-card">
        <p className="text-sm text-muted-foreground">No logs found</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              <th
                className="cursor-pointer px-3 py-2 text-left font-semibold text-muted-foreground hover:bg-muted"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center">
                  Timestamp
                  <SortIcon column="createdAt" />
                </div>
              </th>
              <th
                className="cursor-pointer px-3 py-2 text-left font-semibold text-muted-foreground hover:bg-muted"
                onClick={() => handleSort('user')}
              >
                <div className="flex items-center">
                  User
                  <SortIcon column="user" />
                </div>
              </th>
              <th
                className="cursor-pointer px-3 py-2 text-left font-semibold text-muted-foreground hover:bg-muted"
                onClick={() => handleSort('action')}
              >
                <div className="flex items-center">
                  Action
                  <SortIcon column="action" />
                </div>
              </th>
              <th
                className="cursor-pointer px-3 py-2 text-left font-semibold text-muted-foreground hover:bg-muted"
                onClick={() => handleSort('entityType')}
              >
                <div className="flex items-center">
                  Entity
                  <SortIcon column="entityType" />
                </div>
              </th>
              <th
                className="cursor-pointer px-3 py-2 text-left font-semibold text-muted-foreground hover:bg-muted"
                onClick={() => handleSort('level')}
              >
                <div className="flex items-center">
                  Level
                  <SortIcon column="level" />
                </div>
              </th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <>
                <tr
                  key={log.id}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <td className="px-3 py-2">{formatTimestamp(log.createdAt)}</td>
                  <td className="px-3 py-2">
                    {log.user?.name || log.user?.email || 'System'}
                  </td>
                  <td className="px-3 py-2 capitalize">{log.action}</td>
                  <td className="px-3 py-2">{log.entityType}</td>
                  <td className="px-3 py-2">
                    <Badge
                      variant="outline"
                      className={`h-5 border px-1.5 text-[9px] ${getLevelColor(log.level)}`}
                    >
                      {log.level}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        View
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => toggleRow(log.id)}
                      >
                        {expandedRows.has(log.id) ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
                {expandedRows.has(log.id) && (
                  <tr key={`${log.id}-expanded`}>
                    <td colSpan={6} className="px-3 py-2">
                      <div className="rounded-md border bg-muted/30 p-3 text-xs">
                        <div className="space-y-1">
                          <div>
                            <span className="font-medium">Message:</span>{' '}
                            <span className="text-muted-foreground">{log.message}</span>
                          </div>
                          {log.entityId && (
                            <div>
                              <span className="font-medium">Entity ID:</span>{' '}
                              <span className="text-muted-foreground">{log.entityId}</span>
                            </div>
                          )}
                          {log.metadata?.ip && (
                            <div>
                              <span className="font-medium">IP:</span>{' '}
                              <span className="text-muted-foreground">{log.metadata.ip}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
      <LogDetails />
    </div>
  );
}

