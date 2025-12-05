import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { emailService } from '../services/email.service';
import type { IEmailTemplate, ICreateEmailTemplateRequest } from '../types/email.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

const emailTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  type: z.string().min(1, 'Type is required'),
  isActive: z.boolean().default(true),
});

type EmailTemplateFormData = z.infer<typeof emailTemplateSchema>;

interface EmailTemplateFormProps {
  template: IEmailTemplate | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EmailTemplateForm({ template, onSuccess, onCancel }: EmailTemplateFormProps) {
  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);
  const [customVariables, setCustomVariables] = useState<string[]>([]);
  const [newVariable, setNewVariable] = useState('');
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<EmailTemplateFormData>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: {
      name: template?.name || '',
      subject: template?.subject || '',
      body: template?.body || '',
      type: template?.type || 'notification',
      isActive: template?.isActive ?? true,
    },
  });

  const subject = watch('subject');
  const body = watch('body');

  // Detect variables from subject and body
  useEffect(() => {
    const variablePattern = /\{\{(\w+)\}\}/g;
    const found: string[] = [];
    let match;

    // Check subject
    if (subject) {
      while ((match = variablePattern.exec(subject)) !== null) {
        if (!found.includes(match[1])) {
          found.push(match[1]);
        }
      }
    }

    // Check body
    if (body) {
      // Reset regex
      variablePattern.lastIndex = 0;
      while ((match = variablePattern.exec(body)) !== null) {
        if (!found.includes(match[1])) {
          found.push(match[1]);
        }
      }
    }

    setDetectedVariables(found);
  }, [subject, body]);

  const handleAddVariable = () => {
    if (newVariable.trim() && !detectedVariables.includes(newVariable.trim()) && !customVariables.includes(newVariable.trim())) {
      setCustomVariables([...customVariables, newVariable.trim()]);
      setNewVariable('');
    }
  };

  const handleRemoveCustomVariable = (variable: string) => {
    setCustomVariables(customVariables.filter(v => v !== variable));
  };

  const onSubmit = async (data: EmailTemplateFormData) => {
    try {
      const allVariables = [...detectedVariables, ...customVariables];
      
      const templateData: ICreateEmailTemplateRequest = {
        name: data.name,
        subject: data.subject,
        body: data.body,
        type: data.type,
        isActive: data.isActive,
        variables: allVariables,
      };

      if (template) {
        await emailService.updateTemplate(template.id, templateData);
        showToast({
          title: 'Template updated',
          description: 'Email template has been updated successfully',
          status: 'success',
        });
      } else {
        await emailService.createTemplate(templateData);
        showToast({
          title: 'Template created',
          description: 'Email template has been created successfully',
          status: 'success',
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to save template', error);
      showToast({
        title: 'Failed to save template',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Template Name *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="e.g., Task Assignment Notification"
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label htmlFor="type">Template Type *</Label>
        <Select
          value={watch('type')}
          onValueChange={(value) => setValue('type', value)}
        >
          <SelectTrigger id="type" className={errors.type ? 'border-destructive' : ''}>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="notification">Notification</SelectItem>
            <SelectItem value="approval_request">Approval Request</SelectItem>
            <SelectItem value="task_assigned">Task Assigned</SelectItem>
            <SelectItem value="flow_completed">Flow Completed</SelectItem>
            <SelectItem value="reminder">Reminder</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-sm text-destructive">{errors.type.message}</p>
        )}
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <Label htmlFor="subject">Email Subject *</Label>
        <Input
          id="subject"
          {...register('subject')}
          placeholder="e.g., Task {{taskName}} has been assigned to you"
          className={errors.subject ? 'border-destructive' : ''}
        />
        <p className="text-xs text-muted-foreground">
          Use {`{{variableName}}`} for dynamic content
        </p>
        {errors.subject && (
          <p className="text-sm text-destructive">{errors.subject.message}</p>
        )}
      </div>

      {/* Body */}
      <div className="space-y-2">
        <Label htmlFor="body">Email Body *</Label>
        <Textarea
          id="body"
          {...register('body')}
          placeholder="e.g., Hello {{userName}},&#10;&#10;You have been assigned to task {{taskName}}..."
          rows={12}
          className={errors.body ? 'border-destructive' : ''}
        />
        <p className="text-xs text-muted-foreground">
          Use {`{{variableName}}`} for dynamic content. HTML is supported.
        </p>
        {errors.body && (
          <p className="text-sm text-destructive">{errors.body.message}</p>
        )}
      </div>

      {/* Variables */}
      <div className="space-y-2">
        <Label>Variables</Label>
        <div className="space-y-3">
          {/* Detected Variables */}
          {detectedVariables.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Detected from template:</p>
              <div className="flex flex-wrap gap-2">
                {detectedVariables.map((variable) => (
                  <Badge key={variable} variant="default">
                    {variable}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Custom Variables */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Add custom variables:</p>
            <div className="flex gap-2">
              <Input
                value={newVariable}
                onChange={(e) => setNewVariable(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddVariable();
                  }
                }}
                placeholder="Variable name (without {{}})"
                className="max-w-xs"
              />
              <Button type="button" onClick={handleAddVariable} variant="outline">
                Add
              </Button>
            </div>
            {customVariables.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {customVariables.map((variable) => (
                  <Badge key={variable} variant="secondary" className="gap-1">
                    {variable}
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomVariable(variable)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Status */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isActive"
          checked={watch('isActive')}
          onCheckedChange={(checked) => setValue('isActive', checked === true)}
        />
        <Label htmlFor="isActive" className="cursor-pointer">
          Template is active
        </Label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
}

