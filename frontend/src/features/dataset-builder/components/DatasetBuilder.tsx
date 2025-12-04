import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDatasetStore } from '../store/datasetStore';
import { datasetService, type DatasetSection } from '../services/dataset.service';
import { DatasetList } from './DatasetList';
import { SectionEditor } from './SectionEditor';
import { DatasetPreview } from './DatasetPreview';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

type SectionType = DatasetSection['type'];

const SECTION_TYPE_OPTIONS: Array<{ value: SectionType; label: string }> = [
  { value: 'tasks', label: 'Tasks' },
  { value: 'data-table', label: 'Data Table' },
  { value: 'data-chart', label: 'Data Chart' },
  { value: 'data-cards', label: 'Data Cards' },
  { value: 'text', label: 'Text' },
];

export const DatasetBuilder = () => {
  const {
    currentDataset,
    selectedSection,
    setCurrentDataset,
    setSelectedSection,
    setIsLoading,
    mode,
    setMode,
    reorderSectionsLocal,
  } = useDatasetStore();
  const { showToast } = useToast();
  const [newSectionType, setNewSectionType] = useState<SectionType>('data-table');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // Ensure we always have a selected section when dataset changes.
    if (currentDataset && !selectedSection && currentDataset.sections.length > 0) {
      const first = [...currentDataset.sections].sort((a, b) => a.order - b.order)[0];
      setSelectedSection(first);
    }
  }, [currentDataset, selectedSection, setSelectedSection]);

  const handleNewDataset = async () => {
    try {
      setIsLoading(true);
      const dataset = await datasetService.createDataset({
        name: 'New Dataset',
        description: 'Untitled dataset',
      });
      setCurrentDataset(dataset);
      showToast({
        title: 'Dataset created',
        description: 'You can now add sections to this dataset.',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to create dataset', error);
      showToast({
        title: 'Failed to create dataset',
        description: 'Please try again after reloading the page.',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSection = async () => {
    if (!currentDataset) return;
    try {
      setIsLoading(true);
      const dataset = await datasetService.addSection(currentDataset.id, {
        type: newSectionType,
        title: SECTION_TYPE_OPTIONS.find((o) => o.value === newSectionType)?.label ?? 'Section',
        config: {},
      });
      setCurrentDataset(dataset);
      // Select the newly created section (last by order)
      if (dataset.sections.length > 0) {
        const createdSection =
          dataset.sections.slice().sort((a, b) => a.order - b.order)[dataset.sections.length - 1];
        setSelectedSection(createdSection);
      }
      showToast({
        title: 'Section added',
        description: 'Configure this section from the right panel.',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to add section', error);
      showToast({
        title: 'Failed to add section',
        description: 'Please try again after reloading the dataset.',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!currentDataset) return;
    if (!window.confirm('Delete this section from the dataset?')) return;
    try {
      setIsLoading(true);
      await datasetService.deleteSection(currentDataset.id, sectionId);
      useDatasetStore.getState().deleteSectionLocal(sectionId);
      showToast({
        title: 'Section deleted',
        description: 'The section has been removed from this dataset.',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to delete section', error);
      showToast({
        title: 'Failed to delete section',
        description: 'Please try again after reloading the dataset.',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!currentDataset) return;
    if (!currentDataset.sections || currentDataset.sections.length <= 1) {
      // Nothing meaningful to reorder on the server
      return;
    }
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sorted = [...currentDataset.sections].sort((a, b) => a.order - b.order);
    const oldIndex = sorted.findIndex((s) => s.id === active.id);
    const newIndex = sorted.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sorted, oldIndex, newIndex);
    const ids = reordered.map((s) => s.id);
    reorderSectionsLocal(ids);
    try {
      const updated = await datasetService.reorderSections(currentDataset.id, ids);
      setCurrentDataset(updated);
    } catch (error) {
      console.error('Failed to persist section order', error);
      showToast({
        title: 'Failed to reorder',
        description: 'The new order may not be saved on the server.',
        status: 'error',
      });
    }
  };

  const sections = useMemo<DatasetSection[]>(() => {
    if (!currentDataset) return [];
    return [...currentDataset.sections].sort((a, b) => a.order - b.order);
  }, [currentDataset]);

  const isPreview = mode === 'preview';

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-foreground">Dataset Builder</h1>
          {currentDataset?.status === 'PUBLISHED' && (
            <Badge variant="outline" className="px-2 py-0 text-[10px]">
              Published
            </Badge>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Left: dataset list */}
        <div className="w-[20%] min-w-[200px] border-r">
          <DatasetList onNewDataset={handleNewDataset} />
        </div>

        {/* Middle: canvas / preview */}
        <div className="w-[60%] min-w-[320px] border-r">
          <Tabs
            value={isPreview ? 'preview' : 'canvas'}
            onValueChange={(value) => setMode(value === 'preview' ? 'preview' : 'edit')}
            className="flex h-full flex-col"
          >
            <TabsList className="mx-4 mt-3 h-7 w-fit">
              <TabsTrigger value="canvas" className="h-7 px-3 text-xs">
                Canvas
              </TabsTrigger>
              <TabsTrigger value="preview" className="h-7 px-3 text-xs">
                Preview
              </TabsTrigger>
            </TabsList>
            <TabsContent value="canvas" className="m-0 flex-1">
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between px-4 py-2">
                  <div>
                    <div className="text-xs font-semibold text-foreground">
                      {currentDataset?.name || 'No dataset selected'}
                    </div>
                    {currentDataset?.description && (
                      <div className="text-[11px] text-muted-foreground">
                        {currentDataset.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={newSectionType}
                      onValueChange={(value: SectionType) => setNewSectionType(value)}
                    >
                      <SelectTrigger className="h-8 w-40">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {SECTION_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={handleAddSection}
                      disabled={!currentDataset}
                    >
                      + Add Section
                    </Button>
                  </div>
                </div>

                {!currentDataset ? (
                  <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
                    Select or create a dataset to start adding sections.
                  </div>
                ) : sections.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
                    No sections yet. Use &quot;Add Section&quot; to create one.
                  </div>
                ) : (
                  <ScrollArea className="flex-1">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={sections.map((s) => s.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3 px-4 pb-4 pt-2">
                          {sections.map((section) => (
                            <SortableSectionCard
                              key={section.id}
                              section={section}
                              isSelected={selectedSection?.id === section.id}
                              onSelect={() => setSelectedSection(section)}
                              onDelete={() => handleDeleteSection(section.id)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>
            <TabsContent value="preview" className="m-0 flex-1">
              <DatasetPreview datasetId={currentDataset?.id ?? null} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: section config */}
        <div className="w-[20%] min-w-[220px]">
          <SectionEditor datasetId={currentDataset?.id ?? null} />
        </div>
      </div>
    </div>
  );
};

interface SortableSectionCardProps {
  section: DatasetSection;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const SortableSectionCard = ({
  section,
  isSelected,
  onSelect,
  onDelete,
}: SortableSectionCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const typeLabel =
    SECTION_TYPE_OPTIONS.find((opt) => opt.value === section.type)?.label ?? section.type;

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`flex items-start justify-between border-l-4 px-3 py-2 text-xs transition ${
          isSelected
            ? 'border-l-primary bg-primary/5 ring-1 ring-primary/40'
            : 'border-l-border hover:bg-muted/40'
        }`}
        onClick={onSelect}
      >
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab text-muted-foreground hover:text-foreground"
            >
              ⋮⋮
            </div>
            <div className="font-semibold text-foreground">{section.title}</div>
          </div>
          <div className="flex items-center gap-2 pl-6">
            <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
              {typeLabel}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              Order {section.order}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-[11px] text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            ✕
          </Button>
        </div>
      </Card>
    </div>
  );
};
