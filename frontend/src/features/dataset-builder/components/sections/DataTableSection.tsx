import type { DatasetSection } from '../../services/dataset.service';

interface DataTableSectionProps {
  section: DatasetSection;
  mode: 'edit' | 'preview';
  data?: unknown;
}

export const DataTableSection: React.FC<DataTableSectionProps> = ({ section, mode, data }) => {
  const table = (section.config?.table as string) || 'N/A';
  const columnsConfig = section.config?.columns;
  const columns =
    Array.isArray(columnsConfig) && columnsConfig.every((c) => typeof c === 'string')
      ? (columnsConfig as string[])
      : typeof columnsConfig === 'string'
      ? (columnsConfig as string).split(',').map((c) => c.trim()).filter(Boolean)
      : [];

  if (mode === 'edit') {
    return (
      <div className="space-y-1 text-xs">
        <div className="font-semibold text-foreground">{section.title}</div>
        <div className="text-muted-foreground">
          Data table from <span className="font-medium">{table}</span>{' '}
          {columns.length > 0 && (
            <>
              with columns{' '}
              <span className="font-medium">{columns.join(', ')}</span>
            </>
          )}
        </div>
      </div>
    );
  }

  const rows = Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
  const headerColumns =
    columns.length > 0
      ? columns
      : rows.length > 0
      ? Object.keys(rows[0])
      : [];

  if (rows.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        No data available for this table.
      </div>
    );
  }

  return (
    <div className="space-y-2 text-xs">
      <div className="font-semibold text-foreground">{section.title}</div>
      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full border-collapse text-[11px]">
          <thead className="bg-muted/60">
            <tr>
              {headerColumns.map((col) => (
                <th key={col} className="border-b px-2 py-1 text-left font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <tr key={index} className="odd:bg-background even:bg-muted/40">
                {headerColumns.map((col) => (
                  <td key={col} className="border-b px-2 py-1">
                    {String(row[col] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


