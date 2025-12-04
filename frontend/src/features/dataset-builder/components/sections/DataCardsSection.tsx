import type { DatasetSection } from '../../services/dataset.service';

interface DataCardsSectionProps {
  section: DatasetSection;
  mode: 'edit' | 'preview';
  data?: unknown;
}

export const DataCardsSection: React.FC<DataCardsSectionProps> = ({ section, mode, data }) => {
  const table = (section.config?.table as string) || 'N/A';
  const template = (section.config?.template as string) || '{{name}}';
  const columnsRaw = section.config?.columns;
  const columns =
    typeof columnsRaw === 'number'
      ? columnsRaw
      : Number(columnsRaw) > 0
      ? Number(columnsRaw)
      : 3;

  if (mode === 'edit') {
    return (
      <div className="space-y-1 text-xs">
        <div className="font-semibold text-foreground">{section.title}</div>
        <div className="text-muted-foreground">
          Cards from <span className="font-medium">{table}</span> using template{' '}
          <span className="font-mono text-[11px]">{template}</span> in {columns} columns.
        </div>
      </div>
    );
  }

  const rows = Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];

  if (rows.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        No records to display for this card grid.
      </div>
    );
  }

  const renderTemplate = (row: Record<string, unknown>): string => {
    return template.replace(/\{\{(.*?)\}\}/g, (_, key: string) => {
      const trimmed = key.trim();
      const value = row[trimmed];
      return value === undefined || value === null ? '' : String(value);
    });
  };

  const gridCols =
    columns === 1 ? 'grid-cols-1' : columns === 2 ? 'grid-cols-2' : columns === 4 ? 'grid-cols-4' : 'grid-cols-3';

  return (
    <div className="space-y-2 text-xs">
      <div className="font-semibold text-foreground">{section.title}</div>
      <div className={`grid gap-2 ${gridCols}`}>
        {rows.map((row, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <div
            key={index}
            className="rounded-md border bg-card/60 p-2 shadow-sm"
          >
            <div className="text-xs">{renderTemplate(row)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};


