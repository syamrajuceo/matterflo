import { useEffect, useRef } from 'react';
import { useAuditStore } from '../store/auditStore';
import { auditService } from '../services/audit.service';
import { LogFilters } from './LogFilters';
import { LogTable } from './LogTable';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Download, TestTube } from 'lucide-react';
import axios from 'axios';

export function AuditLogs() {
  const {
    logs,
    filters,
    pagination,
    isLoading,
    setLogs,
    setFilters,
    setPagination,
    setIsLoading,
    setError,
  } = useAuditStore();
  const { showToast } = useToast();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching logs with filters:', filters);
      const response = await auditService.getLogs(filters);
      console.log('Received response:', response);
      setLogs(response.logs || []);
      setPagination({
        page: response.page || 1,
        limit: response.limit || 20,
        total: response.total || 0,
        totalPages: response.totalPages || 0,
      });
    } catch (error) {
      console.error('Failed to fetch audit logs', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load audit logs';
      setError(errorMessage);
      showToast({
        title: 'Failed to load logs',
        description: errorMessage,
        status: 'error',
        duration: 7000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  // Real-time updates - poll every 30 seconds
  useEffect(() => {
    pollIntervalRef.current = setInterval(() => {
      fetchLogs();
    }, 30000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [filters]);

  const handleExport = async () => {
    try {
      setIsLoading(true);
      const blob = await auditService.exportLogs(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast({
        title: 'Export successful',
        description: 'Audit logs have been exported to CSV',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to export audit logs', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to export audit logs';
      showToast({
        title: 'Export failed',
        description: errorMessage,
        status: 'error',
        duration: 7000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTestLogs = async () => {
    try {
      setIsLoading(true);
      await axios.post('/audit/logs/test');
      showToast({
        title: 'Test logs created',
        description: '5 test audit logs have been created. Refresh to see them.',
        status: 'success',
      });
      // Refresh the logs
      await fetchLogs();
    } catch (error) {
      console.error('Failed to create test logs', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create test logs';
      showToast({
        title: 'Failed to create test logs',
        description: errorMessage,
        status: 'error',
        duration: 7000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ page: newPage });
  };

  return (
    <div className="flex h-full flex-col space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Audit Logs</h1>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCreateTestLogs}
            disabled={isLoading}
            className="h-7 text-xs"
            title="Create test audit logs for testing"
          >
            <TestTube className="mr-1 h-3 w-3" />
            Create Test Logs
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleExport}
            disabled={isLoading}
            className="h-7 text-xs"
          >
            <Download className="mr-1 h-3 w-3" />
            Export CSV
          </Button>
        </div>
      </div>

      <LogFilters />

      <div className="flex-1 overflow-hidden">
        {isLoading && logs.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-lg border bg-card">
            <p className="text-sm text-muted-foreground">Loading logs...</p>
          </div>
        ) : (
          <LogTable logs={logs} />
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-2">
          <div className="text-xs text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} logs
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || isLoading}
              className="h-7 text-xs"
            >
              Previous
            </Button>
            <div className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="h-7 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

