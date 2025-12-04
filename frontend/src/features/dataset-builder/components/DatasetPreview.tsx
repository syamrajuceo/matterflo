import { useEffect, useState } from 'react';
import { datasetService, type DatasetWithData } from '../services/dataset.service';
import { useDatasetStore } from '../store/datasetStore';
import { TasksSection } from './sections/TasksSection';
import { DataTableSection } from './sections/DataTableSection';
import { DataChartSection } from './sections/DataChartSection';
import { DataCardsSection } from './sections/DataCardsSection';
import { TextSection } from './sections/TextSection';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';

interface DatasetPreviewProps {
  datasetId: string | null;
}

export const DatasetPreview: React.FC<DatasetPreviewProps> = ({ datasetId }) => {
  const { currentDataset, setIsLoading } = useDatasetStore();
  const { showToast } = useToast();
  const [datasetWithData, setDatasetWithData] = useState<DatasetWithData | null>(null);

  useEffect(() => {
    if (!datasetId) {
      setDatasetWithData(null);
      return;
    }

    const load = async () => {
      try {
        setIsLoading(true);
        const result = await datasetService.getDatasetWithData(datasetId);
        setDatasetWithData(result);
      } catch (error) {
        console.error('Failed to load dataset preview', error);
        showToast({
          title: 'Failed to load preview',
          description: 'Please try again after reloading the dataset.',
          status: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [datasetId, setIsLoading, showToast]);

  if (!currentDataset || !datasetId) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Select a dataset to preview.
      </div>
    );
  }

  const sections =
    (datasetWithData?.dataset ?? currentDataset)?.sections && (datasetWithData?.dataset ?? currentDataset)?.sections.length > 0
      ? (datasetWithData?.dataset ?? currentDataset)!.sections
      : [];
  const dataMap: Record<string, unknown> =
    datasetWithData && datasetWithData.data && typeof datasetWithData.data === 'object'
      ? (datasetWithData.data as Record<string, unknown>)
      : {};

  const resolveSectionData = (sectionId: string): unknown => {
    const byId = dataMap[sectionId];
    if (byId !== undefined) return byId;
    // Fallbacks can be added here (e.g., by type), but keep generic for now.
    return undefined;
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {(datasetWithData?.dataset ?? currentDataset).name}
          </h2>
          {(datasetWithData?.dataset ?? currentDataset).description && (
            <p className="mt-1 text-xs text-muted-foreground">
              {(datasetWithData?.dataset ?? currentDataset).description}
            </p>
          )}
        </div>

        {sections.length === 0 ? (
          <div className="text-xs text-muted-foreground">
            This dataset has no sections yet.
          </div>
        ) : (
          sections
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((section) => {
              const sectionData = resolveSectionData(section.id);
              return (
                <div
                  key={section.id}
                  className="rounded-lg border bg-card/60 p-3 shadow-sm"
                >
                  {section.type === 'tasks' && (
                    <TasksSection section={section} mode="preview" data={sectionData} />
                  )}
                  {section.type === 'data-table' && (
                    <DataTableSection section={section} mode="preview" data={sectionData} />
                  )}
                  {section.type === 'data-chart' && (
                    <DataChartSection section={section} mode="preview" data={sectionData} />
                  )}
                  {section.type === 'data-cards' && (
                    <DataCardsSection section={section} mode="preview" data={sectionData} />
                  )}
                  {section.type === 'text' && (
                    <TextSection section={section} mode="preview" />
                  )}
                </div>
              );
            })
        )}
      </div>
    </ScrollArea>
  );
};


