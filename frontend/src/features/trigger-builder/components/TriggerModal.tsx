import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, TestTube, XCircle } from 'lucide-react';
import { triggerService } from '../../flow-builder/services/trigger.service';
import { ConditionBuilder } from './ConditionBuilder';
import { ActionBuilder } from './ActionBuilder';
import type { ITrigger, ICreateTriggerRequest, EventType } from '../../flow-builder/types/trigger.types';
import type { IConditionGroup, IField } from '../types/condition.types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';

interface TriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: ITrigger;
  flowId?: string;
  levelId?: string;
  taskId?: string;
  onSave?: () => void;
}

// Event type options with labels
const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: 'TASK_COMPLETED', label: 'Task Completed' },
  { value: 'TASK_STARTED', label: 'Task Started' },
  { value: 'TASK_UPDATED', label: 'Task Updated' },
  { value: 'FIELD_CHANGED', label: 'Field Changed' },
  { value: 'FLOW_STARTED', label: 'Flow Started' },
  { value: 'FLOW_COMPLETED', label: 'Flow Completed' },
  { value: 'DATABASE_ROW_CREATED', label: 'Database Row Created' },
  { value: 'DATABASE_ROW_UPDATED', label: 'Database Row Updated' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'WEBHOOK_RECEIVED', label: 'Webhook Received' },
];

// Validation schema
const triggerSchema = z.object({
  name: z.string().min(1, 'Trigger name is required'),
  description: z.string().optional(),
  eventType: z.enum([
    'TASK_COMPLETED',
    'TASK_STARTED',
    'TASK_UPDATED',
    'FIELD_CHANGED',
    'FLOW_STARTED',
    'FLOW_COMPLETED',
    'DATABASE_ROW_CREATED',
    'DATABASE_ROW_UPDATED',
    'SCHEDULED',
    'WEBHOOK_RECEIVED',
  ]),
  hasConditions: z.boolean(),
  conditions: z.any().optional(),
  actions: z.array(z.any()),
  settings: z.object({
    delayExecution: z.number().min(0).optional(),
    preventDuplicates: z.boolean().optional(),
    businessHoursOnly: z.boolean().optional(),
    logging: z.boolean().optional(),
  }).optional(),
});

type TriggerFormData = z.infer<typeof triggerSchema>;

export function TriggerModal({
  isOpen,
  onClose,
  trigger,
  flowId,
  levelId,
  taskId,
  onSave,
}: TriggerModalProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'when' | 'if' | 'then' | 'advanced'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<TriggerFormData>({
    resolver: zodResolver(triggerSchema),
    defaultValues: {
      name: '',
      description: '',
      eventType: 'TASK_COMPLETED',
      hasConditions: false,
      conditions: null,
      actions: [],
      settings: {
        delayExecution: 0,
        preventDuplicates: false,
        businessHoursOnly: false,
        logging: true,
      },
    },
  });

  const hasConditions = watch('hasConditions') || false;
  const eventType = watch('eventType') || 'TASK_COMPLETED';
  const actions = watch('actions') || [];

  // Load trigger data when editing
  useEffect(() => {
    if (!isOpen) return;
    
    try {
      if (trigger) {
        reset({
          name: trigger.name || '',
          description: trigger.description || '',
        eventType: trigger.eventType || 'TASK_COMPLETED',
        hasConditions: !!(trigger.conditions && (Array.isArray(trigger.conditions) ? trigger.conditions.length > 0 : true)),
        conditions: trigger.conditions || null,
        actions: Array.isArray(trigger.actions) ? trigger.actions : [],
          settings: trigger.settings || {
            delayExecution: 0,
            preventDuplicates: false,
            businessHoursOnly: false,
            logging: true,
          },
        });
      } else {
        // Reset form for new trigger
        reset({
          name: '',
          description: '',
        eventType: 'TASK_COMPLETED',
        hasConditions: false,
        conditions: null,
        actions: [],
          settings: {
            delayExecution: 0,
            preventDuplicates: false,
            businessHoursOnly: false,
            logging: true,
          },
        });
      }
    } catch (error) {
      console.error('Error resetting form:', error);
    }
  }, [trigger, isOpen, reset]);

  const onSubmit = async (data: TriggerFormData) => {
    try {
      setIsSaving(true);
      setError(null);

      // Validate actions before submitting
      if (!data.actions || data.actions.length === 0) {
        setError('At least one action is required');
        setIsSaving(false);
        setActiveTab('then'); // Switch to actions tab
        return;
      }

      const triggerData: ICreateTriggerRequest = {
        name: data.name,
        description: data.description,
        eventType: data.eventType,
        eventConfig: {},
        conditions: data.hasConditions && data.conditions ? data.conditions : undefined,
        actions: data.actions,
        settings: data.settings,
        flowId,
        taskId,
        levelId,
      };

      if (trigger) {
        // Update existing trigger
        await triggerService.updateTrigger(trigger.id, triggerData);
      } else {
        // Create new trigger
        await triggerService.createTrigger(triggerData);
      }

      if (onSave) {
        onSave();
      }
      onClose();
      showToast({
        title: trigger ? 'Trigger updated' : 'Trigger created',
        description: 'Your trigger configuration has been saved.',
        status: 'success',
      });
    } catch (err: any) {
      console.error('Failed to save trigger:', err);
      const message = err.response?.data?.error?.message || 'Failed to save trigger';
      setError(message);
      showToast({
        title: 'Failed to save trigger',
        description: message,
        status: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!trigger) {
      showToast({
        title: 'Save trigger first',
        description: 'Please save the trigger before running a test.',
        status: 'warning',
      });
      return;
    }

    try {
      setIsTesting(true);
      await triggerService.testTrigger(trigger.id);
      showToast({
        title: 'Trigger test started',
        description: 'Check execution logs for detailed results.',
        status: 'success',
      });
    } catch (err: any) {
      console.error('Failed to test trigger:', err);
      showToast({
        title: 'Failed to test trigger',
        description: err.response?.data?.error?.message || 'Please try again later.',
        status: 'error',
      });
    } finally {
      setIsTesting(false);
    }
  };


  // Get available fields based on context
  // TODO: Fetch actual fields from task/flow when available
  const getAvailableFields = (): IField[] => {
    // For now, return some default fields
    // In the future, this should fetch fields from the task or flow
    return [
      { id: 'amount', name: 'amount', type: 'number', label: 'Amount' },
      { id: 'status', name: 'status', type: 'dropdown', label: 'Status', options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
      ]},
      { id: 'category', name: 'category', type: 'text', label: 'Category' },
      { id: 'description', name: 'description', type: 'text', label: 'Description' },
      { id: 'date', name: 'date', type: 'date', label: 'Date' },
      { id: 'isActive', name: 'isActive', type: 'boolean', label: 'Is Active' },
    ];
  };

  // Early return if not open
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop + Drawer */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-[640px] flex-col border-l bg-card shadow-2xl transition-transform duration-300 translate-x-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-6">
          <h2 className="text-xl font-semibold text-foreground">
            {trigger ? 'Edit Trigger' : 'Create Trigger'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as typeof activeTab)}
          className="flex h-full flex-col"
        >
          {/* Tabs */}
          <TabsList className="mx-6 mt-4 grid w-auto grid-cols-5 justify-start">
            <TabsTrigger value="basic" className="text-xs">
              Basic
            </TabsTrigger>
            <TabsTrigger value="when" className="text-xs">
              WHEN
            </TabsTrigger>
            <TabsTrigger value="if" className="text-xs">
              IF
            </TabsTrigger>
            <TabsTrigger value="then" className="text-xs">
              THEN
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs">
              Advanced
            </TabsTrigger>
          </TabsList>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-3 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              <XCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Content - Scrollable */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1">
            <ScrollArea className="h-[calc(100vh-220px)]">
              <div className="space-y-6 px-6 py-4">
                {/* Section 1: Basic Info */}
                <TabsContent value="basic" className="m-0 mt-0 space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Trigger Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        {...register('name')}
                        type="text"
                        className="w-full rounded-lg border bg-background px-4 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g., High-Value Alert"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Description
                      </label>
                      <textarea
                        {...register('description')}
                        rows={3}
                        className="w-full resize-none rounded-lg border bg-background px-4 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Optional description of what this trigger does"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Section 2: WHEN (Event Selection) */}
                <TabsContent value="when" className="m-0 mt-0 space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Event Type <span className="text-destructive">*</span>
                      </label>
                      <select
                        {...register('eventType')}
                        className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {EVENT_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.eventType && (
                        <p className="mt-1 text-sm text-destructive">
                          {errors.eventType.message}
                        </p>
                      )}
                    </div>

                    <div className="rounded-lg border bg-background p-4">
                      <p className="text-sm text-muted-foreground">
                        This trigger will fire when a{' '}
                        <strong className="text-foreground">
                          {EVENT_TYPE_OPTIONS.find((o) => o.value === eventType)?.label}
                        </strong>{' '}
                        event occurs.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {/* Section 3: IF (Conditions) */}
                <TabsContent value="if" className="m-0 mt-0 space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="hasConditions"
                        {...register('hasConditions')}
                        className="h-4 w-4 rounded border border-border bg-background text-primary focus:ring-primary"
                      />
                      <label
                        htmlFor="hasConditions"
                        className="text-sm font-medium text-foreground"
                      >
                        Add conditions (otherwise always trigger)
                      </label>
                    </div>

                    {hasConditions && (
                      <div className="rounded-lg border bg-background p-4">
                        <ConditionBuilder
                          value={watch('conditions') as IConditionGroup | null}
                          onChange={(conditions) => {
                            setValue('conditions', conditions);
                          }}
                          availableFields={getAvailableFields()}
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Section 4: THEN (Actions) */}
                <TabsContent value="then" className="m-0 mt-0 space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Actions <span className="text-destructive">*</span>
                      </label>
                      <ActionBuilder
                        value={actions || []}
                        onChange={(newActions) => {
                          setValue('actions', newActions);
                        }}
                      />
                      {errors.actions && (
                        <p className="mt-2 text-sm text-destructive">{errors.actions.message}</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Section 5: Advanced Settings */}
                <TabsContent value="advanced" className="m-0 mt-0 space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Delay Execution (seconds)
                      </label>
                      <input
                        type="number"
                        {...register('settings.delayExecution', { valueAsNumber: true })}
                        min="0"
                        className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="preventDuplicates"
                          {...register('settings.preventDuplicates')}
                          className="h-4 w-4 rounded border border-border bg-background text-primary focus:ring-primary"
                        />
                        <label
                          htmlFor="preventDuplicates"
                          className="text-sm font-medium text-foreground"
                        >
                          Prevent duplicate executions
                        </label>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="businessHoursOnly"
                          {...register('settings.businessHoursOnly')}
                          className="h-4 w-4 rounded border border-border bg-background text-primary focus:ring-primary"
                        />
                        <label
                          htmlFor="businessHoursOnly"
                          className="text-sm font-medium text-foreground"
                        >
                          Business hours only
                        </label>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="logging"
                          {...register('settings.logging')}
                          className="h-4 w-4 rounded border border-border bg-background text-primary focus:ring-primary"
                        />
                        <label
                          htmlFor="logging"
                          className="text-sm font-medium text-foreground"
                        >
                          Enable detailed logging
                        </label>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t bg-card p-6">
              <button
                type="button"
                onClick={handleTest}
                disabled={!trigger || isTesting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                <TestTube className="h-4 w-4" />
                Test Trigger
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Trigger'}
                </button>
              </div>
            </div>
          </form>
        </Tabs>
      </div>
    </>
  );
}

