import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDatabaseStore } from '../store/databaseStore';
import { databaseService } from '../services/database.service';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from './DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ITableRecord } from '../types/database.types';

export function RecordManager() {
  const { currentTable, currentRecords, setCurrentRecords, setHasUnsavedChanges } = useDatabaseStore();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterField, setFilterField] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState('');
  const [isAddRecordDialogOpen, setIsAddRecordDialogOpen] = useState(false);
  const [isEditRecordDialogOpen, setIsEditRecordDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ITableRecord | null>(null);
  const [recordData, setRecordData] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    if (currentTable) {
      void loadRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTable]);

  const loadRecords = async (): Promise<void> => {
    if (!currentTable) return;

    try {
      setIsLoading(true);
      const response = await databaseService.queryRecords(currentTable.id, {
        limit: 1000,
      });
      setCurrentRecords(response.records);
      setCurrentPage(1);
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Failed to load records:', error);
      showToast({
        title: 'Failed to load records',
        description: 'Please try again.',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRecord = () => {
    if (!currentTable) return;
    
    // Initialize record data with default values
    const initialData: Record<string, unknown> = {};
    currentTable.schema.fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        initialData[field.name] = field.defaultValue;
      }
    });
    setRecordData(initialData);
    setIsAddRecordDialogOpen(true);
  };

  const handleEditRecord = (record: ITableRecord) => {
    setEditingRecord(record);
    setRecordData({ ...record.data });
    setIsEditRecordDialogOpen(true);
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!currentTable) return;

    if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      return;
    }

    try {
      await databaseService.deleteRecord(currentTable.id, recordId);
      setCurrentRecords(currentRecords.filter((r) => r.id !== recordId));
      showToast({
        title: 'Record deleted',
        description: 'The record has been deleted successfully.',
        status: 'success',
      });
    } catch (error: unknown) {
      console.error('Failed to delete record:', error);
      let errorMessage = 'Failed to delete record';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
        errorMessage =
          axiosError.response?.data?.error?.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      showToast({
        title: 'Failed to delete record',
        description: errorMessage,
        status: 'error',
      });
    }
  };

  const handleSaveRecord = async (): Promise<void> => {
    if (!currentTable) return;

    try {
      // Client-side validation
      const validationErrors: string[] = [];

      // Validate required fields
      const requiredFields = currentTable.schema.fields.filter((f) => f.required);
      for (const field of requiredFields) {
        if (recordData[field.name] === undefined || recordData[field.name] === null || recordData[field.name] === '') {
          validationErrors.push(`${field.displayName} is required.`);
        }
      }

      // Validate field types
      for (const field of currentTable.schema.fields) {
        const value = recordData[field.name];
        if (value === undefined || value === null || value === '') continue;

        switch (field.type) {
          case 'number':
            if (typeof value !== 'number' && !/^-?\d+(\.\d+)?$/.test(String(value))) {
              validationErrors.push(`${field.displayName} must be a number.`);
            } else {
              const numValue = typeof value === 'number' ? value : parseFloat(String(value));
              if (field.validation?.min !== undefined && numValue < field.validation.min) {
                validationErrors.push(`${field.displayName} must be at least ${field.validation.min}.`);
              }
              if (field.validation?.max !== undefined && numValue > field.validation.max) {
                validationErrors.push(`${field.displayName} must be at most ${field.validation.max}.`);
              }
            }
            break;

          case 'boolean':
            if (typeof value !== 'boolean' && value !== 'true' && value !== 'false' && value !== 1 && value !== 0) {
              validationErrors.push(`${field.displayName} must be true or false.`);
            }
            break;

          case 'date':
            // Normalize to string for Date.parse
            if (isNaN(Date.parse(String(value)))) {
              validationErrors.push(`${field.displayName} must be a valid date.`);
            }
            break;

          case 'text':
            if (typeof value !== 'string') {
              validationErrors.push(`${field.displayName} must be text.`);
            } else {
              if (field.validation?.pattern) {
                try {
                  const regex = new RegExp(field.validation.pattern);
                  if (!regex.test(value)) {
                    validationErrors.push(`${field.displayName} does not match the required format.`);
                  }
                } catch {
                  // Invalid regex pattern, skip
                }
              }
              if (field.validation?.min !== undefined && value.length < field.validation.min) {
                validationErrors.push(`${field.displayName} must be at least ${field.validation.min} characters.`);
              }
              if (field.validation?.max !== undefined && value.length > field.validation.max) {
                validationErrors.push(`${field.displayName} must be at most ${field.validation.max} characters.`);
              }
            }
            break;
        }
      }

      // Show client-side validation errors
      if (validationErrors.length > 0) {
        showToast({
          title: 'Validation error',
          description: validationErrors[0] || 'Please check your input and try again.',
          status: 'error',
        });
        return;
      }

      // Reset selection before save
      setSelectedIds(new Set());

      if (editingRecord) {
        // Update existing record
        const updated = await databaseService.updateRecord(currentTable.id, editingRecord.id, recordData);
        setCurrentRecords(currentRecords.map((r) => (r.id === updated.id ? updated : r)));
        showToast({
          title: 'Record updated',
          description: 'The record has been updated successfully.',
          status: 'success',
        });
      } else {
        // Create new record
        const newRecord = await databaseService.insertRecord(currentTable.id, recordData);
        setCurrentRecords([...currentRecords, newRecord]);
        showToast({
          title: 'Record created',
          description: 'The record has been created successfully.',
          status: 'success',
        });
      }

      setIsAddRecordDialogOpen(false);
      setIsEditRecordDialogOpen(false);
      setEditingRecord(null);
      setRecordData({});
      setHasUnsavedChanges(true);
    } catch (error: unknown) {
      console.error('Failed to save record:', error);
      
      // Extract error message from response
      let errorMessage = 'Failed to save record';
      let errorTitle = 'Validation Error';

      if (typeof error === 'object' && error !== null && 'response' in error) {
        type ErrorData = {
          error?: {
            code?: string;
            message?: string;
            details?: unknown;
          };
          message?: string;
        };

        const axiosError = error as { response?: { data?: ErrorData } };
        const errorData: ErrorData | undefined = axiosError.response?.data;
        
        // Handle different error response formats
        if (errorData?.error) {
          errorMessage = errorData.error.message || errorMessage;
          
          // Provide more specific error titles based on error code
          if (errorData.error.code === 'VALIDATION_ERROR') {
            errorTitle = 'Validation Error';
            
            // Check if it's a unique constraint violation
            if (errorMessage.includes('already exists')) {
              errorTitle = 'Duplicate Value';
              // The backend message format: "Value "X" for field "Y" already exists"
              // Extract and format it nicely
              const valueMatch = errorMessage.match(/Value "([^"]+)"/);
              const fieldMatch = errorMessage.match(/field "([^"]+)"/);
              if (valueMatch && fieldMatch) {
                errorMessage = `The value "${valueMatch[1]}" for ${fieldMatch[1]} already exists. This field must be unique.`;
              }
            } else if (errorMessage.includes('must be a number')) {
              errorTitle = 'Invalid Number';
            } else if (errorMessage.includes('must be a valid date')) {
              errorTitle = 'Invalid Date';
            } else if (errorMessage.includes('must be a boolean')) {
              errorTitle = 'Invalid Boolean';
            } else if (errorMessage.includes('must be a string')) {
              errorTitle = 'Invalid Text';
            } else if (errorMessage.includes('is required')) {
              errorTitle = 'Required Field Missing';
            } else if (errorMessage.includes('must be at least')) {
              errorTitle = 'Value Too Small';
            } else if (errorMessage.includes('must be at most')) {
              errorTitle = 'Value Too Large';
            } else if (errorMessage.includes('does not match')) {
              errorTitle = 'Invalid Format';
            }
          } else if (errorData.error.code === 'DUPLICATE_ENTRY') {
            errorTitle = 'Duplicate Entry';
            // Try to extract field name from message
            const match = errorMessage.match(/Field "([^"]+)"/);
            if (match) {
              errorMessage = `${match[1]} already exists. This field must be unique.`;
            }
          } else if (errorData.error.code === 'NOT_FOUND') {
            errorTitle = 'Not Found';
          }
          
          // Replace field names with display names in error message
          const details = errorData.error.details;
          if (details && typeof details === 'object') {
            const detailsObj = details as { field?: string };
            if (detailsObj.field) {
              const field = currentTable.schema.fields.find((f) => f.name === detailsObj.field);
              if (field) {
                // Replace both quoted and unquoted field names
                errorMessage = errorMessage.replace(new RegExp(`"${field.name}"`, 'g'), `"${field.displayName}"`);
                errorMessage = errorMessage.replace(new RegExp(field.name, 'g'), field.displayName);
              }
            }
          } else {
            // Try to find and replace field names in the message even without details
            for (const field of currentTable.schema.fields) {
              if (errorMessage.includes(`"${field.name}"`)) {
                errorMessage = errorMessage.replace(new RegExp(`"${field.name}"`, 'g'), `"${field.displayName}"`);
              }
            }
          }
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      showToast({
        title: errorTitle,
        description: errorMessage,
        status: 'error',
      });
    }
  };

  // Derived records with search, filter, and sort
  const filteredRecords = useMemo<ITableRecord[]>(() => {
    let result: ITableRecord[] = [...currentRecords];

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      result = result.filter((record) =>
        Object.values(record.data).some((value) =>
          String(value).toLowerCase().includes(searchLower)
        )
      );
    }

    if (filterField && filterValue) {
      const filterLower = filterValue.toLowerCase();
      result = result.filter((record) =>
        String(record.data[filterField] ?? '').toLowerCase().includes(filterLower)
      );
    }

    if (sortField) {
      result.sort((a, b) => {
        const aVal = a.data[sortField as string];
        const bVal = b.data[sortField as string];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return sortDirection === 'asc' ? -1 : 1;
        if (bVal == null) return sortDirection === 'asc' ? 1 : -1;

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [currentRecords, searchQuery, filterField, filterValue, sortField, sortDirection]);

  const totalRecords = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const pageStartIndex = (currentPage - 1) * pageSize;
  const paginatedRecords = filteredRecords.slice(pageStartIndex, pageStartIndex + pageSize);

  const handleSortChange = (fieldName: string) => {
    if (sortField === fieldName) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(fieldName);
      setSortDirection('asc');
    }
  };

  const handleToggleSelect = (recordId: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(recordId);
      } else {
        next.delete(recordId);
      }
      return next;
    });
  };

  const handleToggleSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedIds(new Set(paginatedRecords.map((record) => record.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleChangePage = (direction: 'prev' | 'next') => {
    setCurrentPage((prev) => {
      if (direction === 'prev') return Math.max(1, prev - 1);
      return Math.min(totalPages, prev + 1);
    });
  };

  if (!currentTable) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select a table to view records</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Toolbar */}
      <div className="border-b bg-card px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[220px]">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search records..."
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 max-w-sm"
              />
            </div>
          </div>

          {/* Simple field filter */}
          <div className="flex items-center gap-2">
            <Select
              value={filterField ?? ''}
              onValueChange={(value) => {
                setFilterField(value || null);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All fields</SelectItem>
                {currentTable.schema.fields.map((field) => (
                  <SelectItem key={field.id} value={field.name}>
                    {field.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="text"
              placeholder="Filter value"
              value={filterValue}
              onChange={(event) => {
                setFilterValue(event.target.value);
                setCurrentPage(1);
              }}
              className="w-[160px]"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterField(null);
                setFilterValue('');
                setCurrentPage(1);
              }}
            >
              Clear
            </Button>
          </div>

          <Button size="sm" onClick={handleAddRecord}>
            <Plus className="h-4 w-4 mr-2" />
            Add Record
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto">
        <DataTable
          table={currentTable}
          records={paginatedRecords}
          onEdit={handleEditRecord}
          onDelete={handleDeleteRecord}
          isLoading={isLoading}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          selectedRecordIds={Array.from(selectedIds)}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          pageOffset={pageStartIndex}
        />
      </div>

      {/* Pagination */}
      <div className="border-t bg-card px-6 py-2 text-xs text-muted-foreground flex items-center justify-between">
        <div>
          {totalRecords === 0 ? (
            'No records'
          ) : (
            <span>
              Showing {pageStartIndex + 1}-{Math.min(pageStartIndex + pageSize, totalRecords)} of {totalRecords} records
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => handleChangePage('prev')}
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Prev
          </Button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => handleChangePage('next')}
          >
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Add Record Dialog */}
      <Dialog open={isAddRecordDialogOpen} onOpenChange={setIsAddRecordDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Record</DialogTitle>
            <DialogDescription>Fill in the fields to create a new record.</DialogDescription>
          </DialogHeader>
          <RecordForm
            table={currentTable}
            recordData={recordData}
            setRecordData={setRecordData}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRecordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRecord}>Save Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Record Dialog */}
      <Dialog open={isEditRecordDialogOpen} onOpenChange={setIsEditRecordDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Record</DialogTitle>
            <DialogDescription>Update the record fields.</DialogDescription>
          </DialogHeader>
          <RecordForm
            table={currentTable}
            recordData={recordData}
            setRecordData={setRecordData}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRecordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRecord}>Update Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface RecordFormProps {
  table: {
    schema: {
      fields: Array<{
        id: string;
        name: string;
        displayName: string;
        type: string;
        required: boolean;
        unique?: boolean;
        defaultValue?: unknown;
        validation?: {
          min?: number;
          max?: number;
          pattern?: string;
        };
        description?: string;
      }>;
    };
  };
  recordData: Record<string, unknown>;
  setRecordData: (data: Record<string, unknown>) => void;
}

function RecordForm({ table, recordData, setRecordData }: RecordFormProps) {
  const updateField = (fieldName: string, value: unknown, fieldType: string) => {
    let processedValue = value;
    
    // Convert value based on field type
    if (fieldType === 'number') {
      if (value === '' || value === null || value === undefined) {
        processedValue = undefined;
      } else {
        const numValue = Number(value);
        processedValue = isNaN(numValue) ? value : numValue;
      }
    } else if (fieldType === 'boolean') {
      processedValue = Boolean(value);
    } else if (fieldType === 'date' && value) {
      // Ensure date is in YYYY-MM-DD format
      processedValue = value;
    }
    
    setRecordData({ ...recordData, [fieldName]: processedValue });
  };

  return (
    <div className="space-y-4 py-4">
      {table.schema.fields.map((field) => {
        const raw = recordData[field.name];
        const stringValue = raw == null ? '' : String(raw);
        const dateValue = raw != null ? String(raw).split('T')[0] : '';

        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {field.displayName}
              {field.required && <span className="text-destructive ml-1">*</span>}
              {field.unique && (
                <span className="ml-2 text-xs text-muted-foreground">(Unique)</span>
              )}
            </label>
            {field.type === 'text' && (
              <Input
                value={stringValue}
                onChange={(event) => updateField(field.name, event.target.value, 'text')}
                placeholder={field.defaultValue ? String(field.defaultValue) : ''}
                required={field.required}
                maxLength={field.validation?.max}
                minLength={field.validation?.min}
              />
            )}
            {field.type === 'number' && (
              <Input
                type="number"
                value={stringValue}
                onChange={(event) => {
                  const value = event.target.value;
                  updateField(field.name, value === '' ? undefined : value, 'number');
                }}
                min={field.validation?.min}
                max={field.validation?.max}
                step={
                  field.validation?.min !== undefined && field.validation?.max !== undefined
                    ? (field.validation.max - field.validation.min) / 100
                    : undefined
                }
                required={field.required}
              />
            )}
            {field.type === 'boolean' && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={Boolean(raw)}
                  onChange={(event) => updateField(field.name, event.target.checked, 'boolean')}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm text-muted-foreground">
                  {raw ? 'Yes' : 'No'}
                </span>
              </div>
            )}
            {field.type === 'date' && (
              <Input
                type="date"
                value={dateValue}
                onChange={(event) => updateField(field.name, event.target.value, 'date')}
                required={field.required}
              />
            )}
            {field.type === 'relation' && (
              <Input
                value={stringValue}
                onChange={(event) => updateField(field.name, event.target.value, 'text')}
                placeholder="Enter related record ID"
                required={field.required}
              />
            )}
            {field.type === 'computed' && (
              <Input
                value={stringValue}
                disabled
                className="bg-muted cursor-not-allowed"
                placeholder="Computed field (auto-calculated)"
              />
            )}
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

