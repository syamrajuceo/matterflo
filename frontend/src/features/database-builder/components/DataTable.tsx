import { Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ICustomTable, ITableRecord } from '../types/database.types';

interface DataTableProps {
  table: ICustomTable;
  records: ITableRecord[];
  onEdit: (record: ITableRecord) => void;
  onDelete: (recordId: string) => void;
  isLoading?: boolean;
  sortField?: string | null;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (fieldName: string) => void;
  selectedRecordIds?: string[];
  onToggleSelect?: (recordId: string, selected: boolean) => void;
  onToggleSelectAll?: (selectAll: boolean) => void;
  pageOffset?: number;
}

export function DataTable({
  table,
  records,
  onEdit,
  onDelete,
  isLoading,
  sortField,
  sortDirection = 'asc',
  onSortChange,
  selectedRecordIds,
  onToggleSelect,
  onToggleSelectAll,
  pageOffset = 0,
}: DataTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Loading records...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-2">No records found</p>
        <p className="text-sm text-muted-foreground">Add your first record to get started</p>
      </div>
    );
  }

  const visibleFields = table.schema.fields;
  const selectedSet = new Set(selectedRecordIds ?? []);

  const renderSortIcon = (fieldName: string) => {
    if (!onSortChange) return null;
    if (sortField !== fieldName) return <ArrowUpDown className="ml-1 h-3 w-3" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-muted/50">
            {/* Selection column */}
            <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
              {onToggleSelectAll && (
                <input
                  type="checkbox"
                  checked={records.length > 0 && records.every((r) => selectedSet.has(r.id))}
                  onChange={(event) => onToggleSelectAll(event.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
              )}
            </th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
              #
            </th>
            {visibleFields.map((field) => (
              <th
                key={field.id}
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase cursor-pointer select-none"
                onClick={() => onSortChange && onSortChange(field.name)}
              >
                <span className="inline-flex items-center">
                  {field.displayName}
                  {renderSortIcon(field.name)}
                </span>
              </th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => (
            <tr
              key={record.id}
              className="border-b hover:bg-muted/30 transition-colors"
            >
              <td className="px-3 py-3 text-sm text-muted-foreground">
                {onToggleSelect && (
                  <input
                    type="checkbox"
                    checked={selectedSet.has(record.id)}
                    onChange={(event) => onToggleSelect(record.id, event.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                )}
              </td>
              <td className="px-3 py-3 text-sm text-muted-foreground">{pageOffset + index + 1}</td>
              {visibleFields.map((field) => (
                <td key={field.id} className="px-4 py-3 text-sm text-foreground">
                  {field.type === 'boolean' ? (
                    record.data?.[field.name] ? 'Yes' : 'No'
                  ) : (
                    String(record.data?.[field.name] ?? '—')
                  )}
                </td>
              ))}
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(record)}
                    className="h-8 w-8"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(record.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

