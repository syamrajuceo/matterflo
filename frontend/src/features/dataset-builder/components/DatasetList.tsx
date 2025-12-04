import { useEffect } from 'react';
import { useDatasetStore } from '../store/datasetStore';
import { datasetService } from '../services/dataset.service';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface DatasetListProps {
  onNewDataset: () => void;
}

export const DatasetList: React.FC<DatasetListProps> = ({ onNewDataset }) => {
  const {
    datasets,
    currentDataset,
    setDatasets,
    setCurrentDataset,
    setIsLoading,
    removeDatasetLocal,
  } = useDatasetStore();
  const { showToast } = useToast();

  useEffect(() => {
    const loadDatasets = async () => {
      try {
        setIsLoading(true);
        const items = await datasetService.listDatasets();
        setDatasets(items);
        if (!currentDataset && items.length > 0) {
          setCurrentDataset(items[0]);
        }
      } catch (error) {
        console.error('Failed to load datasets', error);
        showToast({
          title: 'Failed to load datasets',
          description: 'Please try again in a moment.',
          status: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    void loadDatasets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = async (id: string) => {
    try {
      setIsLoading(true);
      const dataset = await datasetService.getDataset(id);
      setCurrentDataset(dataset);
    } catch (error) {
      console.error('Failed to load dataset', error);
      showToast({
        title: 'Failed to open dataset',
        description: 'Please try again after reloading the page.',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const target = datasets.find((d) => d.id === id);
    const name = target?.name || 'this dataset';
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) {
      return;
    }
    try {
      setIsLoading(true);
      await datasetService.deleteDataset(id);
      removeDatasetLocal(id);
      showToast({
        title: 'Dataset deleted',
        description: 'The dataset has been removed.',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to delete dataset', error);
      showToast({
        title: 'Failed to delete dataset',
        description: 'Please try again after reloading the page.',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col border-r bg-card/40">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="text-xs font-medium text-muted-foreground">Datasets</div>
        <Button size="xs" variant="outline" onClick={onNewDataset}>
          + New
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {datasets.length === 0 ? (
            <div className="px-2 py-4 text-xs text-muted-foreground">
              No datasets yet. Create one to get started.
            </div>
          ) : (
            datasets.map((ds) => (
              <div
                key={ds.id}
                className={cn(
                  'flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-xs transition',
                  'hover:bg-muted',
                  currentDataset?.id === ds.id ? 'bg-primary/10 text-primary' : 'text-foreground'
                )}
              >
                <button
                  type="button"
                  onClick={() => handleSelect(ds.id)}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  <span className="text-base">📊</span>
                  <span className="line-clamp-1 font-medium">{ds.name}</span>
                </button>
                <button
                  type="button"
                  className="ml-1 h-5 w-5 rounded-md text-[10px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDelete(ds.id)}
                  aria-label={`Delete dataset ${ds.name}`}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};


