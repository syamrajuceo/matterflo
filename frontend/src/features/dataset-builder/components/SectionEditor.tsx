import { useEffect, useState } from 'react';
import type { DatasetSection } from '../services/dataset.service';
import { useDatasetStore } from '../store/datasetStore';
import { datasetService } from '../services/dataset.service';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

type SectionType = DatasetSection['type'];

interface SectionEditorProps {
  datasetId: string | null;
}

export const SectionEditor: React.FC<SectionEditorProps> = ({ datasetId }) => {
  const { selectedSection, updateSectionLocal, setSelectedSection } = useDatasetStore();
  const { showToast } = useToast();

  const [localTitle, setLocalTitle] = useState<string>('');
  const [localType, setLocalType] = useState<SectionType>('data-table');
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!selectedSection) {
      setLocalTitle('');
      setConfig({});
      return;
    }
    setLocalTitle(selectedSection.title);
    setLocalType(selectedSection.type);
    setConfig(selectedSection.config ?? {});
  }, [selectedSection]);

  if (!selectedSection) {
    return (
      <div className="flex h-full items-center justify-center px-3 text-center text-xs text-muted-foreground">
        Select a section to configure its settings.
      </div>
    );
  }

  const handleConfigChange = (partial: Record<string, unknown>): void => {
    setConfig((prev) => ({ ...prev, ...partial }));
  };

  const handleSave = async () => {
    if (!datasetId) return;
    setIsSaving(true);
    try {
      // Prepare config in the shape backend expects
      let finalConfig: Record<string, unknown> = { ...config };
      if (localType === 'data-table') {
        const rawColumns = config.columns;
        if (typeof rawColumns === 'string') {
          finalConfig = {
            ...finalConfig,
            columns: rawColumns
              .split(',')
              .map((c) => c.trim())
              .filter(Boolean),
          };
        }
      }

      const dataset = await datasetService.updateSection(datasetId, selectedSection.id, {
        title: localTitle,
        config: finalConfig,
      });
      const updatedSection =
        dataset.sections.find((s) => s.id === selectedSection.id) ?? selectedSection;
      updateSectionLocal(updatedSection.id, updatedSection);
      setSelectedSection(updatedSection);
      showToast({
        title: 'Section updated',
        description: 'Your section configuration has been saved.',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to update section', error);
      showToast({
        title: 'Failed to save section',
        description: 'Please try again after reloading the dataset.',
        status: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderTypeSpecificFields = () => {
    switch (localType) {
      case 'tasks': {
        const source = (config.source as string) || 'tasks';
        const status = (config.status as string) || 'ANY';
        const limit =
          typeof config.limit === 'number'
            ? config.limit
            : Number(config.limit) > 0
            ? Number(config.limit)
            : 10;
        return (
          <>
            <div className="space-y-1">
              <Label className="text-[11px]">Source</Label>
              <Input
                value={source}
                onChange={(e) => handleConfigChange({ source: e.target.value })}
                placeholder="tasks"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Status</Label>
              <Input
                value={status}
                onChange={(e) => handleConfigChange({ status: e.target.value })}
                placeholder="ANY / OPEN / DONE"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Limit</Label>
              <Input
                type="number"
                value={limit}
                onChange={(e) => handleConfigChange({ limit: Number(e.target.value) || 0 })}
                min={1}
              />
            </div>
          </>
        );
      }
      case 'data-table': {
        const table = (config.table as string) || '';
        const columns =
          typeof config.columns === 'string'
            ? (config.columns as string)
            : Array.isArray(config.columns)
            ? (config.columns as string[]).join(', ')
            : '';
        const sortField = (config.sortField as string) || '';
        const sortDirection = (config.sortDirection as string) || 'DESC';
        return (
          <>
            <div className="space-y-1">
              <Label className="text-[11px]">Table</Label>
              <Input
                value={table}
                onChange={(e) => handleConfigChange({ table: e.target.value })}
                placeholder="orders"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Columns (comma separated)</Label>
              <Input
                value={columns}
                onChange={(e) =>
                  handleConfigChange({
                    columns: e.target.value,
                  })
                }
                placeholder="order_id, customer, amount"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Sort field</Label>
              <Input
                value={sortField}
                onChange={(e) => handleConfigChange({ sortField: e.target.value })}
                placeholder="created_at"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Sort direction</Label>
              <Select
                value={sortDirection}
                onValueChange={(value) => handleConfigChange({ sortDirection: value })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASC">ASC</SelectItem>
                  <SelectItem value="DESC">DESC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      }
      case 'data-chart': {
        const chartType = (config.chartType as string) || 'bar';
        const table = (config.table as string) || '';
        const xField = (config.xField as string) || '';
        const yField = (config.yField as string) || '';
        return (
          <>
            <div className="space-y-1">
              <Label className="text-[11px]">Chart type</Label>
              <Select
                value={chartType}
                onValueChange={(value) => handleConfigChange({ chartType: value })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="pie">Pie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Table</Label>
              <Input
                value={table}
                onChange={(e) => handleConfigChange({ table: e.target.value })}
                placeholder="orders"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">X field</Label>
              <Input
                value={xField}
                onChange={(e) => handleConfigChange({ xField: e.target.value })}
                placeholder="created_at"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Y field</Label>
              <Input
                value={yField}
                onChange={(e) => handleConfigChange({ yField: e.target.value })}
                placeholder="amount"
              />
            </div>
          </>
        );
      }
      case 'data-cards': {
        const table = (config.table as string) || '';
        const template = (config.template as string) || '{{name}} - {{email}}';
        const columnsRaw = config.columns;
        const columns =
          typeof columnsRaw === 'number'
            ? columnsRaw
            : Number(columnsRaw) > 0
            ? Number(columnsRaw)
            : 3;
        return (
          <>
            <div className="space-y-1">
              <Label className="text-[11px]">Table</Label>
              <Input
                value={table}
                onChange={(e) => handleConfigChange({ table: e.target.value })}
                placeholder="customers"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Template</Label>
              <Input
                value={template}
                onChange={(e) => handleConfigChange({ template: e.target.value })}
                placeholder="{{name}} - {{email}}"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Columns</Label>
              <Input
                type="number"
                value={columns}
                onChange={(e) => handleConfigChange({ columns: Number(e.target.value) || 1 })}
                min={1}
                max={4}
              />
            </div>
          </>
        );
      }
      case 'text':
      default: {
        const content = (config.content as string) || '';
        return (
          <div className="space-y-1">
            <Label className="text-[11px]">Content (markdown)</Label>
            <Textarea
              rows={6}
              value={content}
              onChange={(e) => handleConfigChange({ content: e.target.value })}
              placeholder="Write some explanatory text or notes for this dashboard..."
            />
          </div>
        );
      }
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-3 py-2">
        <div className="text-xs font-medium text-muted-foreground">Section Config</div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        <div className="space-y-1">
          <Label className="text-[11px]">Title</Label>
          <Input
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            placeholder="Section title"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">Type</Label>
          <Select
            value={localType}
            onValueChange={(value: SectionType) => setLocalType(value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tasks">Tasks</SelectItem>
              <SelectItem value="data-table">Data Table</SelectItem>
              <SelectItem value="data-chart">Data Chart</SelectItem>
              <SelectItem value="data-cards">Data Cards</SelectItem>
              <SelectItem value="text">Text</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="h-px bg-border/60" />

        {renderTypeSpecificFields()}
      </div>
      <div className="flex justify-end gap-2 border-t px-3 py-2">
        <Button size="sm" onClick={handleSave} disabled={isSaving || !datasetId}>
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
};


