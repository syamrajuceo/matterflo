import { useEffect, useState } from 'react';
import { Download, Upload, AlertTriangle } from 'lucide-react';
import { databaseService } from '../services/database.service';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useDatabaseStore } from '../store/databaseStore';

interface ImportExportProps {
  tableId: string;
}

export function ImportExport({ tableId }: ImportExportProps) {
  const { showToast } = useToast();
  const { setCurrentRecords, currentTable } = useDatabaseStore();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [previewErrors, setPreviewErrors] = useState<Array<{ row: number; errors: string[] }>>([]);

  // Reset preview when dialog closes
  useEffect(() => {
    if (!isImportDialogOpen) {
      setImportFile(null);
      setIsPreviewing(false);
      setPreviewRows([]);
      setPreviewHeaders([]);
      setPreviewErrors([]);
    }
  }, [isImportDialogOpen]);

  const handleExport = async () => {
    try {
      const blob = await databaseService.exportCSV(tableId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `table-${tableId}-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showToast({
        title: 'Export successful',
        description: 'The table data has been exported to CSV.',
        status: 'success',
      });
    } catch (error: any) {
      console.error('Failed to export CSV:', error);
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to export CSV';
      showToast({
        title: 'Export failed',
        description: errorMessage,
        status: 'error',
      });
    }
  };

  const parseCsvPreview = async (file: File): Promise<void> => {
    if (!currentTable) {
      showToast({
        title: 'No table selected',
        description: 'Select a table before importing CSV.',
        status: 'error',
      });
      return;
    }

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
      if (lines.length < 2) {
        showToast({
          title: 'Invalid CSV',
          description: 'CSV must contain a header row and at least one data row.',
          status: 'error',
        });
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim());
      const rows: Record<string, string>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = (values[index] ?? '').trim();
        });
        rows.push(row);
      }

      // Basic validation against schema
      const errors: Array<{ row: number; errors: string[] }> = [];
      const schemaFields = currentTable.schema.fields;

      // Check required headers
      for (const field of schemaFields) {
        if (!headers.includes(field.name)) {
          errors.push({
            row: 1,
            errors: [`Missing required column "${field.name}" in header.`],
          });
        }
      }

      // Per-row validation (lightweight)
      rows.forEach((row, index) => {
        const rowErrors: string[] = [];
        const displayRow = index + 2; // account for header

        for (const field of schemaFields) {
          const raw = row[field.name];
          if (field.required && (!raw || raw.trim() === '')) {
            rowErrors.push(`${field.displayName} is required.`);
            continue;
          }
          if (!raw) continue;

          switch (field.type) {
            case 'number': {
              if (!/^-?\d+(\.\d+)?$/.test(raw)) {
                rowErrors.push(`${field.displayName} must be a number.`);
              }
              break;
            }
            case 'date': {
              if (isNaN(Date.parse(raw))) {
                rowErrors.push(`${field.displayName} must be a valid date.`);
              }
              break;
            }
            case 'boolean': {
              if (!['true', 'false', '1', '0'].includes(raw.toLowerCase())) {
                rowErrors.push(`${field.displayName} must be true or false.`);
              }
              break;
            }
            default:
              break;
          }
        }

        if (rowErrors.length > 0) {
          errors.push({ row: displayRow, errors: rowErrors });
        }
      });

      setPreviewHeaders(headers);
      setPreviewRows(rows.slice(0, 50)); // preview first 50 rows
      setPreviewErrors(errors);
      setIsPreviewing(true);
    } catch (error) {
      console.error('Failed to parse CSV for preview:', error);
      showToast({
        title: 'Preview failed',
        description: 'Could not read the CSV file. Please check the format and try again.',
        status: 'error',
      });
    }
  };

  const handleImportConfirm = async () => {
    if (!importFile) return;

    try {
      setIsImporting(true);
      const result = await databaseService.importCSV(tableId, importFile);
      
      // Reload records
      const recordsData = await databaseService.queryRecords(tableId, { limit: 100 });
      setCurrentRecords(recordsData.records);

      showToast({
        title: 'Import successful',
        description: `Imported ${result.imported} record${result.imported === 1 ? '' : 's'}.`,
        status: 'success',
      });

      setIsImportDialogOpen(false);
    } catch (error: any) {
      console.error('Failed to import CSV:', error);
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to import CSV';
      showToast({
        title: 'Import failed',
        description: errorMessage,
        status: 'error',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import records. The first row should contain column headers matching your field names.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <input
                type="file"
                accept=".csv"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  setImportFile(file);
                  if (file) {
                    void parseCsvPreview(file);
                  } else {
                    setIsPreviewing(false);
                    setPreviewRows([]);
                    setPreviewHeaders([]);
                    setPreviewErrors([]);
                  }
                }}
                className="w-full text-sm"
              />
            </div>

            {isPreviewing && (
              <div className="rounded-md border bg-muted/40 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Previewing <span className="font-semibold">{previewRows.length}</span> row
                    {previewRows.length === 1 ? '' : 's'} (showing up to first 50)
                  </div>
                  {previewErrors.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-destructive">
                      <AlertTriangle className="h-3 w-3" />
                      {previewErrors.length} row
                      {previewErrors.length === 1 ? '' : 's'} with validation issues
                    </div>
                  )}
                </div>

                <div className="max-h-64 overflow-auto rounded-md border bg-card">
                  <table className="min-w-full border-collapse text-xs">
                    <thead className="border-b bg-muted">
                      <tr>
                        <th className="px-2 py-1 text-left text-[10px] font-semibold text-muted-foreground">
                          #
                        </th>
                        {previewHeaders.map((header) => (
                          <th
                            key={header}
                            className="px-2 py-1 text-left text-[10px] font-semibold text-muted-foreground"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, index) => {
                        const rowNumber = index + 2; // header is row 1
                        const rowError = previewErrors.find((e) => e.row === rowNumber);
                        return (
                          <tr
                            key={rowNumber}
                            className={rowError ? 'bg-destructive/5' : undefined}
                          >
                            <td className="px-2 py-1 text-[11px] text-muted-foreground">{rowNumber}</td>
                            {previewHeaders.map((header) => (
                              <td key={header} className="max-w-[160px] truncate px-2 py-1 text-[11px]">
                                {row[header] ?? ''}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {previewErrors.length > 0 && (
                  <div className="mt-2 space-y-1 text-[11px] text-destructive">
                    {previewErrors.slice(0, 5).map((err) => (
                      <div key={err.row}>
                        Row {err.row}: {err.errors.join(' ')}
                      </div>
                    ))}
                    {previewErrors.length > 5 && (
                      <div>...and {previewErrors.length - 5} more rows with issues.</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportConfirm} disabled={!importFile || isImporting}>
              {isImporting ? 'Importing...' : previewErrors.length > 0 ? 'Import Anyway' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

