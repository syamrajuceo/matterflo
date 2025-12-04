import { useMemo } from 'react';
import type { DatasetSection } from '../../services/dataset.service';
import { Textarea } from '@/components/ui/textarea';

interface TextSectionProps {
  section: DatasetSection;
  mode: 'edit' | 'preview';
}

export const TextSection: React.FC<TextSectionProps> = ({ section, mode }) => {
  const content = useMemo(() => {
    const raw = section.config?.content;
    return typeof raw === 'string' ? raw : '';
  }, [section.config]);

  if (mode === 'edit') {
    return (
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Text content</div>
        <Textarea value={content} readOnly rows={4} className="resize-none text-xs" />
      </div>
    );
  }

  return (
    <div className="prose prose-invert max-w-none text-xs">
      {content || <span className="text-muted-foreground">No content configured.</span>}
    </div>
  );
};


