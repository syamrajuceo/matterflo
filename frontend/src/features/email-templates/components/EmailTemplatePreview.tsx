import { useState, useEffect } from 'react';
import { emailService } from '../services/email.service';
import type { IEmailTemplate } from '../types/email.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, Eye } from 'lucide-react';

interface EmailTemplatePreviewProps {
  template: IEmailTemplate;
  isOpen: boolean;
  onClose: () => void;
}

export function EmailTemplatePreview({
  template,
  isOpen,
  onClose,
}: EmailTemplatePreviewProps) {
  const [previewSubject, setPreviewSubject] = useState('');
  const [previewBody, setPreviewBody] = useState('');
  const [sampleVariables, setSampleVariables] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  // Initialize sample variables
  useEffect(() => {
    if (template && isOpen) {
      const defaults: Record<string, string> = {};
      template.variables.forEach((variable) => {
        defaults[variable] = `[${variable}]`;
      });
      setSampleVariables(defaults);
    }
  }, [template, isOpen]);

  // Load preview when variables change
  useEffect(() => {
    if (template && isOpen && Object.keys(sampleVariables).length > 0) {
      loadPreview();
    }
  }, [sampleVariables, template, isOpen]);

  const loadPreview = async () => {
    try {
      setIsLoading(true);
      const preview = await emailService.previewTemplate(template.id, sampleVariables);
      setPreviewSubject(preview.subject);
      setPreviewBody(preview.body);
    } catch (error) {
      console.error('Failed to load preview', error);
      showToast({
        title: 'Failed to load preview',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVariableChange = (variable: string, value: string) => {
    setSampleVariables({
      ...sampleVariables,
      [variable]: value,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Preview: {template.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Info */}
          <div className="flex items-center gap-2">
            <Badge variant="outline">{template.type}</Badge>
            <Badge variant={template.isActive ? 'default' : 'secondary'}>
              {template.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {/* Variables Input */}
          {template.variables.length > 0 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Sample Variables</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter sample values to preview the template
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {template.variables.map((variable) => (
                  <div key={variable} className="space-y-1">
                    <Label htmlFor={`var-${variable}`} className="text-xs">
                      {variable}
                    </Label>
                    <Input
                      id={`var-${variable}`}
                      value={sampleVariables[variable] || ''}
                      onChange={(e) => handleVariableChange(variable, e.target.value)}
                      placeholder={`Enter ${variable}`}
                      className="h-8"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Preview */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <Label className="text-sm font-medium">Preview</Label>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading preview...
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-muted/50 space-y-4">
                {/* Subject Preview */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Subject:
                  </Label>
                  <div className="font-medium text-sm">{previewSubject || template.subject}</div>
                </div>

                {/* Body Preview */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Body:
                  </Label>
                  <div
                    className="prose prose-sm max-w-none text-sm"
                    dangerouslySetInnerHTML={{
                      __html: previewBody || template.body,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

