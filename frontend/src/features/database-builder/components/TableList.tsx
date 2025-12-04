import { useEffect, useState } from 'react';
import { Search, Database } from 'lucide-react';
import { databaseService } from '../services/database.service';
import { useDatabaseStore } from '../store/databaseStore';
import type { ICustomTable } from '../types/database.types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export function TableList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { tables, setTables, currentTable, setCurrentTable, setIsLoading: setStoreLoading } = useDatabaseStore();
  const { showToast } = useToast();

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setIsLoading(true);
      setStoreLoading(true);
      const loadedTables = await databaseService.listTables();
      setTables(loadedTables);
    } catch (error) {
      console.error('Failed to load tables:', error);
      showToast({
        title: 'Failed to load tables',
        description: 'Please refresh the page to try again.',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
      setStoreLoading(false);
    }
  };

  const handleSelectTable = async (table: ICustomTable) => {
    try {
      const fullTable = await databaseService.getTable(table.id);
      setCurrentTable(fullTable);
    } catch (error) {
      console.error('Failed to load table:', error);
      showToast({
        title: 'Failed to load table',
        description: 'Please try again.',
        status: 'error',
      });
    }
  };

  const filteredTables = tables.filter((table) =>
    table.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    table.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-[20%] flex-col border-r bg-card">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold text-foreground">Tables</h2>
        <div className="relative mt-3">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Table List */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Loading tables...</p>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Database className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No tables found' : 'No tables yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredTables.map((table) => (
              <Card
                key={table.id}
                onClick={() => handleSelectTable(table)}
                className={`cursor-pointer p-3 transition-colors hover:bg-accent ${
                  currentTable?.id === table.id ? 'bg-accent border-primary' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 flex-shrink-0 text-primary" />
                      <h3 className="truncate text-sm font-medium text-foreground">
                        {table.displayName}
                      </h3>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground truncate">
                      {table.name}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {table.recordCount} record{table.recordCount === 1 ? '' : 's'}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {table.schema.fields.length} field{table.schema.fields.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

