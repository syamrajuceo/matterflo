import { useForm } from 'react-hook-form';
import type { IPdfAction } from '../../types/action.types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import React from 'react';
import { FileText } from 'lucide-react';

interface PdfActionProps {
  action: IPdfAction;
  onChange: (action: IPdfAction) => void;
  availableTasks?: Array<{ id: string; name: string }>;
  availableFlows?: Array<{ id: string; name: string }>;
  emailActionsCount?: number;
}

type PdfActionFormData = {
  sourceType: 'task' | 'flow' | 'custom';
  sourceId: string;
  template: string;
  filename: string;
  includeData: boolean;
  attachToEmail: boolean;
  emailActionIndex: number;
};

export function PdfAction({
  action,
  onChange,
  availableTasks = [],
  availableFlows = [],
  emailActionsCount = 0,
}: PdfActionProps) {
  const { register, watch, setValue, formState: { errors } } = useForm<PdfActionFormData>({
    defaultValues: {
      sourceType: action.sourceType || 'task',
      sourceId: action.sourceId || '',
      template: action.template || '',
      filename: action.filename || 'document-{{timestamp}}.pdf',
      includeData: action.includeData ?? true,
      attachToEmail: action.attachToEmail ?? false,
      emailActionIndex: action.emailActionIndex ?? 0,
    },
  });

  const sourceType = watch('sourceType');
  const sourceId = watch('sourceId');
  const template = watch('template');
  const filename = watch('filename');
  const includeData = watch('includeData');
  const attachToEmail = watch('attachToEmail');
  const emailActionIndex = watch('emailActionIndex');

  const handleChange = () => {
    const updatedAction: IPdfAction = {
      type: 'pdf',
      sourceType: sourceType,
      sourceId: sourceType !== 'custom' ? sourceId : undefined,
      template: sourceType === 'custom' ? template : undefined,
      filename: filename || undefined,
      includeData: includeData,
      attachToEmail: attachToEmail,
      emailActionIndex: attachToEmail ? emailActionIndex : undefined,
    };
    onChange(updatedAction);
  };

  // Trigger onChange when form values change
  React.useEffect(() => {
    handleChange();
  }, [sourceType, sourceId, template, filename, includeData, attachToEmail, emailActionIndex]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Generate PDF</h3>
      </div>

      {/* Source Type */}
      <div className="space-y-2">
        <Label>PDF Source</Label>
        <Select
          value={sourceType}
          onValueChange={(value) => {
            setValue('sourceType', value as 'task' | 'flow' | 'custom');
            handleChange();
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="task">From Task Execution</SelectItem>
            <SelectItem value="flow">From Flow Instance</SelectItem>
            <SelectItem value="custom">Custom Template</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Source ID (for task/flow) */}
      {sourceType !== 'custom' && (
        <div className="space-y-2">
          <Label>
            {sourceType === 'task' ? 'Task' : 'Flow Instance'} ID
          </Label>
          <Input
            {...register('sourceId', { required: sourceType !== 'custom' })}
            placeholder={
              sourceType === 'task'
                ? 'Enter task execution ID or use {{taskExecutionId}}'
                : 'Enter flow instance ID or use {{flowInstanceId}}'
            }
            onChange={(e) => {
              setValue('sourceId', e.target.value);
              handleChange();
            }}
          />
          {errors.sourceId && (
            <p className="text-sm text-destructive">{errors.sourceId.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Use variables like {`{{taskExecutionId}}`} or {`{{flowInstanceId}}`} from trigger context
          </p>
        </div>
      )}

      {/* Custom Template */}
      {sourceType === 'custom' && (
        <div className="space-y-2">
          <Label>Template Content</Label>
          <Textarea
            {...register('template', { required: sourceType === 'custom' })}
            placeholder="# Title&#10;## Section&#10;Content with {{variables}}"
            rows={8}
            onChange={(e) => {
              setValue('template', e.target.value);
              handleChange();
            }}
          />
          {errors.template && (
            <p className="text-sm text-destructive">{errors.template.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Use Markdown-like syntax: # for title, ## for section, plain text for content. Use {`{{variable}}`} for dynamic values.
          </p>
        </div>
      )}

      {/* Filename */}
      <div className="space-y-2">
        <Label>Output Filename</Label>
        <Input
          {...register('filename')}
          placeholder="document-{{timestamp}}.pdf"
          onChange={(e) => {
            setValue('filename', e.target.value);
            handleChange();
          }}
        />
        <p className="text-xs text-muted-foreground">
          Use {`{{variables}}`} for dynamic filenames. Default: document-{`{{timestamp}}`}.pdf
        </p>
      </div>

      {/* Include Data */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="includeData"
          checked={includeData}
          onCheckedChange={(checked) => {
            setValue('includeData', checked === true);
            handleChange();
          }}
        />
        <Label htmlFor="includeData" className="cursor-pointer">
          Include form data/execution data in PDF
        </Label>
      </div>

      {/* Attach to Email */}
      {emailActionsCount > 0 && (
        <>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="attachToEmail"
              checked={attachToEmail}
              onCheckedChange={(checked) => {
                setValue('attachToEmail', checked === true);
                handleChange();
              }}
            />
            <Label htmlFor="attachToEmail" className="cursor-pointer">
              Attach PDF to email action
            </Label>
          </div>

          {attachToEmail && (
            <div className="space-y-2 ml-6">
              <Label>Email Action Index</Label>
              <Select
                value={String(emailActionIndex)}
                onValueChange={(value) => {
                  setValue('emailActionIndex', parseInt(value));
                  handleChange();
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: emailActionsCount }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>
                      Email Action #{i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select which email action to attach this PDF to (0-indexed)
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}


