import { useState, useEffect } from 'react';
import { useAuditStore } from '../store/auditStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ENTITY_TYPES = [
  { value: 'all', label: 'All Entities' },
  { value: 'Task', label: 'Task' },
  { value: 'Flow', label: 'Flow' },
  { value: 'Trigger', label: 'Trigger' },
  { value: 'User', label: 'User' },
  { value: 'Role', label: 'Role' },
  { value: 'Department', label: 'Department' },
  { value: 'Integration', label: 'Integration' },
  { value: 'Workflow', label: 'Workflow' },
];

const ACTIONS = [
  { value: 'all', label: 'All Actions' },
  { value: 'created', label: 'Created' },
  { value: 'updated', label: 'Updated' },
  { value: 'deleted', label: 'Deleted' },
  { value: 'executed', label: 'Executed' },
  { value: 'failed', label: 'Failed' },
  { value: 'activated', label: 'Activated' },
  { value: 'deactivated', label: 'Deactivated' },
];

const LEVELS = [
  { value: 'all', label: 'All Levels' },
  { value: 'INFO', label: 'INFO' },
  { value: 'WARN', label: 'WARN' },
  { value: 'ERROR', label: 'ERROR' },
  { value: 'CRITICAL', label: 'CRITICAL' },
];

const DATE_RANGES = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'last24hours', label: 'Last 24 Hours' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'last90days', label: 'Last 90 Days' },
];

export function LogFilters() {
  const { filters, setFilters, resetFilters } = useAuditStore();
  const [dateRange, setDateRange] = useState<string>('last7days');

  useEffect(() => {
    // Set default date range to last 7 days
    if (!filters.startDate && !filters.endDate) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      setFilters({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    }
  }, []);

  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    const endDate = new Date();
    let startDate = new Date();

    switch (value) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last24hours':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case 'last7days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'last30days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'last90days':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'all':
        setFilters({ startDate: undefined, endDate: undefined });
        return;
      default:
        setFilters({ startDate: undefined, endDate: undefined });
        return;
    }

    setFilters({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  };

  const handleClearFilters = () => {
    resetFilters();
    setDateRange('last7days');
    // Reset to last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    setFilters({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  };

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="text-xs font-semibold text-foreground">Filters</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Entity Type</Label>
          <Select
            value={filters.entity || 'all'}
            onValueChange={(value) => setFilters({ entity: value === 'all' ? undefined : value })}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="All Entities" />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value} className="text-xs">
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Action</Label>
          <Select
            value={filters.action || 'all'}
            onValueChange={(value) => setFilters({ action: value === 'all' ? undefined : value })}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              {ACTIONS.map((action) => (
                <SelectItem key={action.value} value={action.value} className="text-xs">
                  {action.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Level</Label>
          <Select
            value={filters.level || 'all'}
            onValueChange={(value) => setFilters({ level: value === 'all' ? undefined : value })}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              {LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value} className="text-xs">
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Date Range</Label>
          <Select value={dateRange} onValueChange={handleDateRangeChange}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value} className="text-xs">
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>


      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground">Search</Label>
        <Input
          value={filters.search || ''}
          onChange={(e) => setFilters({ search: e.target.value || undefined })}
          placeholder="Search logs..."
          className="h-7 text-xs"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => {
            // Filters are applied automatically via setFilters, but this provides visual feedback
            // Force a re-fetch by updating a dummy filter
            setFilters({ ...filters });
          }}
          className="h-7 text-xs"
        >
          Apply Filters
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleClearFilters}
          className="h-7 text-xs"
        >
          Clear
        </Button>
      </div>
    </div>
  );
}

