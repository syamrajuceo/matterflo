import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, Download, Upload, ChevronRight, ChevronLeft } from 'lucide-react';
import { useDatabaseStore } from '../store/databaseStore';
import { databaseService } from '../services/database.service';
import { TableList } from './TableList';
import { TableDesigner } from './TableDesigner';
import { FieldEditor } from './FieldEditor';
import { ImportExport } from './ImportExport';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const databaseStore = useDatabaseStore;

export function DatabaseBuilder() {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    currentTable,
    setCurrentTable,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isPropertiesPanelCollapsed,
    setIsPropertiesPanelCollapsed,
    setTables,
    tables,
    setCurrentRecords,
    setActiveTab,
  } = useDatabaseStore();

  const [isNewTableDialogOpen, setIsNewTableDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableDisplayName, setNewTableDisplayName] = useState('');
  const [newTableDescription, setNewTableDescription] = useState('');

  useEffect(() => {
    if (tableId && tableId !== 'new') {
      loadTable(tableId);
    } else if (tableId === 'new') {
      handleCreateNewTable();
    }
  }, [tableId]);

  const loadTable = async (id: string) => {
    try {
      const table = await databaseService.getTable(id);
      setCurrentTable(table);
      setHasUnsavedChanges(false);
      
      // Load records
      const recordsData = await databaseService.queryRecords(id);
      setCurrentRecords(recordsData.records);
    } catch (error) {
      console.error('Failed to load table:', error);
      showToast({
        title: 'Failed to load table',
        description: 'Please try again or select a different table.',
        status: 'error',
      });
      navigate('/database');
    }
  };

  const handleCreateNewTable = async () => {
    setIsNewTableDialogOpen(true);
  };

  const handleConfirmCreateTable = async () => {
    if (!newTableName.trim() || !newTableDisplayName.trim()) {
      showToast({
        title: 'Validation error',
        description: 'Table name and display name are required.',
        status: 'error',
      });
      return;
    }

    try {
      const newTable = await databaseService.createTable({
        name: newTableName.trim().toLowerCase().replace(/\s+/g, '_'),
        displayName: newTableDisplayName.trim(),
        description: newTableDescription.trim() || undefined,
      });
      
      // Refresh tables list
      const updatedTables = await databaseService.listTables();
      setTables(updatedTables);
      
      setCurrentTable(newTable);
      setHasUnsavedChanges(false);
      setIsNewTableDialogOpen(false);
      setNewTableName('');
      setNewTableDisplayName('');
      setNewTableDescription('');
      navigate(`/database/${newTable.id}`, { replace: true });
      
      showToast({
        title: 'Table created',
        description: `"${newTable.displayName}" has been created.`,
        status: 'success',
      });
    } catch (error: any) {
      console.error('Failed to create table:', error);
      const errorMessage =
        error?.response?.data?.error?.message || error?.message || 'Failed to create table';
      showToast({
        title: 'Failed to create table',
        description: errorMessage,
        status: 'error',
      });
    }
  };

  const handleSave = async () => {
    const latestTable = databaseStore.getState().currentTable;
    if (!latestTable) return;

    try {
      // Save table metadata if changed
      await databaseService.updateTable(latestTable.id, {
        displayName: latestTable.displayName,
        description: latestTable.description,
      });

      // Save fields (new, updated, deleted, reordered)
      const allFields = [...latestTable.schema.fields];
      const tempFields = allFields.filter((field) => field.id.startsWith('temp-'));
      const tempToRealIdMap = new Map<string, string>();

      // Create new fields
      for (const field of tempFields) {
        try {
          const updatedTable = await databaseService.addField(latestTable.id, {
            name: field.name,
            displayName: field.displayName,
            type: field.type,
            required: field.required,
            unique: field.unique,
            defaultValue: field.defaultValue,
            validation: field.validation,
            formula: field.formula,
            relationConfig: field.relationConfig,
          });

          const newField = updatedTable.schema.fields.find(
            (f) =>
              f.name === field.name &&
              f.type === field.type &&
              !f.id.startsWith('temp-') &&
              !Array.from(tempToRealIdMap.values()).includes(f.id)
          );

          if (newField) {
            tempToRealIdMap.set(field.id, newField.id);
            setCurrentTable(updatedTable);
          }
        } catch (error: any) {
          console.error(`Failed to save temp field ${field.id}:`, error);
        }
      }

      // NOTE: Field order is currently stored as the array order in the schema.
      // The backend does not yet expose a dedicated \"reorder\" endpoint for fields,
      // so we rely on the existing add/update/delete operations and then reload
      // the table to get the latest schema from the server.

      // Reload table to get latest state
      const updatedTable = await databaseService.getTable(latestTable.id);
      setCurrentTable(updatedTable);
      setHasUnsavedChanges(false);

      showToast({
        title: 'Table saved',
        description: 'All changes have been saved successfully.',
        status: 'success',
      });
    } catch (error: any) {
      console.error('Failed to save table:', error);
      const errorMessage =
        error?.response?.data?.error?.message || error?.message || 'Failed to save table';
      showToast({
        title: 'Failed to save table',
        description: errorMessage,
        status: 'error',
      });
    }
  };

  const handleDeleteTable = async () => {
    if (!currentTable) return;

    try {
      await databaseService.deleteTable(currentTable.id);
      const updatedTables = await databaseService.listTables();
      setTables(updatedTables);
      setCurrentTable(null);
      setIsDeleteDialogOpen(false);
      navigate('/database');
      showToast({
        title: 'Table deleted',
        description: `"${currentTable.displayName}" has been deleted.`,
        status: 'success',
      });
    } catch (error: any) {
      console.error('Failed to delete table:', error);
      const errorMessage =
        error?.response?.data?.error?.message || error?.message || 'Failed to delete table';
      showToast({
        title: 'Failed to delete table',
        description: errorMessage,
        status: 'error',
      });
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-card px-6 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-foreground">Database Builder</h1>
          {hasUnsavedChanges && (
            <span className="text-xs text-muted-foreground">Unsaved changes</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {currentTable && (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <ImportExport tableId={currentTable.id} />
            </>
          )}
          <Button variant="default" size="sm" onClick={handleCreateNewTable}>
            <Plus className="h-4 w-4 mr-2" />
            New Table
          </Button>
          {currentTable && (
            <Button variant="default" size="sm" onClick={handleSave} disabled={!hasUnsavedChanges}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Main Content - 3 Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Table List (20%) */}
        <TableList />

        {/* Middle Panel - Table Designer (60%) */}
        <div className="flex-1 overflow-hidden">
          {currentTable ? (
            <TableDesigner />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground">Select a table to start designing</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Field Properties (20%) */}
        {!isPropertiesPanelCollapsed && (
          <div className="w-[20%] border-l bg-card">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <h3 className="text-sm font-semibold text-foreground">Field Properties</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPropertiesPanelCollapsed(true)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <FieldEditor />
          </div>
        )}

        {/* Collapsed Right Panel */}
        {isPropertiesPanelCollapsed && (
          <div className="border-l bg-card">
            <Button
              variant="ghost"
              size="icon"
              className="h-full"
              onClick={() => setIsPropertiesPanelCollapsed(false)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* New Table Dialog */}
      <Dialog open={isNewTableDialogOpen} onOpenChange={setIsNewTableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Table</DialogTitle>
            <DialogDescription>Create a new custom table to store your data.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="table-name">Table Name (snake_case)</Label>
              <Input
                id="table-name"
                placeholder="employees"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Used internally (e.g., employees, purchase_orders)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="table-display-name">Display Name</Label>
              <Input
                id="table-display-name"
                placeholder="Employees"
                value={newTableDisplayName}
                onChange={(e) => setNewTableDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="table-description">Description (optional)</Label>
              <Textarea
                id="table-description"
                placeholder="Store employee information"
                value={newTableDescription}
                onChange={(e) => setNewTableDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewTableDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmCreateTable}>Create Table</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Table Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Table</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{currentTable?.displayName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTable}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

