import { useState, useEffect } from 'react';
import type { IIntegration, IIntegrationWorkflow, ITriggerConfig, IActionConfig } from '../services/integrations.service';
import { useIntegrationsStore } from '../store/integrationsStore';
import { integrationsService } from '../services/integrations.service';
import { extractErrorMessage, extractErrorTitle } from '../utils/errorHandler';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2, Play, X, FileText } from 'lucide-react';

interface WorkflowEditorProps {
  integration: IIntegration;
  isOpen: boolean;
  onClose: () => void;
}

export const WorkflowEditor = ({ integration, isOpen, onClose }: WorkflowEditorProps) => {
  const { addWorkflow, updateWorkflow, removeWorkflow } = useIntegrationsStore();
  const { showToast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<IIntegrationWorkflow | null>(null);
  const [workflowName, setWorkflowName] = useState('');
  const [triggerEvent, setTriggerEvent] = useState('');
  const [actionType, setActionType] = useState('');
  const [triggerFilters, setTriggerFilters] = useState<Record<string, unknown>>({});
  const [actionParams, setActionParams] = useState<Record<string, unknown>>({});
  const [filterKey, setFilterKey] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [paramKey, setParamKey] = useState('');
  const [paramValue, setParamValue] = useState('');
  const [showExecutionLogs, setShowExecutionLogs] = useState(false);

  useEffect(() => {
    if (editingWorkflow) {
      setWorkflowName(editingWorkflow.name);
      setTriggerEvent(editingWorkflow.triggerConfig.event);
      setActionType(editingWorkflow.actionConfig.action);
      setTriggerFilters(editingWorkflow.triggerConfig.filters || {});
      setActionParams(editingWorkflow.actionConfig.params || {});
    } else {
      resetForm();
    }
  }, [editingWorkflow]);

  const resetForm = () => {
    setWorkflowName('');
    setTriggerEvent('');
    setActionType('');
    setTriggerFilters({});
    setActionParams({});
  };

  const handleSaveWorkflow = async () => {
    if (!workflowName.trim() || !triggerEvent || !actionType) {
      showToast({
        title: 'Validation error',
        description: 'Please fill in all required fields.',
        status: 'error',
      });
      return;
    }

    try {
      const triggerConfig: ITriggerConfig = {
        event: triggerEvent,
        filters: Object.keys(triggerFilters).length > 0 ? triggerFilters : undefined,
      };

      const actionConfig: IActionConfig = {
        action: actionType,
        params: Object.keys(actionParams).length > 0 ? actionParams : undefined,
      };

      if (editingWorkflow) {
        const updated = await integrationsService.updateWorkflow(
          integration.id,
          editingWorkflow.id,
          {
            name: workflowName.trim(),
            triggerConfig,
            actionConfig,
          }
        );
        updateWorkflow(integration.id, editingWorkflow.id, updated);
        showToast({
          title: 'Workflow updated',
          description: 'The workflow has been updated successfully.',
          status: 'success',
        });
      } else {
        const newWorkflow = await integrationsService.createWorkflow(integration.id, {
          name: workflowName.trim(),
          triggerConfig,
          actionConfig,
          isActive: true,
        });
        addWorkflow(integration.id, newWorkflow);
        showToast({
          title: 'Workflow created',
          description: 'The new workflow has been created successfully.',
          status: 'success',
        });
      }

      setEditingWorkflow(null);
      resetForm();
    } catch (error) {
      console.error('Failed to save workflow', error);
      const errorMessage = extractErrorMessage(error);
      const errorTitle = extractErrorTitle(error, 'Failed to save workflow');
      showToast({
        title: errorTitle,
        description: errorMessage,
        status: 'error',
        duration: 7000,
      });
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!window.confirm('Delete this workflow? This cannot be undone.')) return;

    try {
      await integrationsService.deleteWorkflow(integration.id, workflowId);
      removeWorkflow(integration.id, workflowId);
      showToast({
        title: 'Workflow deleted',
        description: 'The workflow has been removed.',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to delete workflow', error);
      const errorMessage = extractErrorMessage(error);
      const errorTitle = extractErrorTitle(error, 'Failed to delete workflow');
      showToast({
        title: errorTitle,
        description: errorMessage,
        status: 'error',
        duration: 7000,
      });
    }
  };

  const handleTestWorkflow = async (workflow: IIntegrationWorkflow) => {
    try {
      const testData = {
        event: workflow.triggerConfig.event,
        ...workflow.triggerConfig.filters,
      };
      const result = await integrationsService.testWorkflow(
        integration.id,
        workflow.id,
        testData
      );
      showToast({
        title: 'Workflow test completed',
        description: result.success 
          ? 'Test passed successfully. The workflow would execute with this data.' 
          : `Test failed: ${typeof result.result === 'object' && result.result !== null ? JSON.stringify(result.result) : String(result.result)}`,
        status: result.success ? 'success' : 'error',
      });
    } catch (error) {
      console.error('Failed to test workflow', error);
      const errorMessage = extractErrorMessage(error);
      const errorTitle = extractErrorTitle(error, 'Failed to test workflow');
      showToast({
        title: errorTitle,
        description: errorMessage,
        status: 'error',
        duration: 7000, // Show error messages longer
      });
    }
  };

  const getTriggerEvents = () => {
    switch (integration.type) {
      case 'WEBHOOK':
        return ['webhook_received'];
      case 'GMAIL':
        return ['email_received', 'email_sent'];
      case 'GOOGLE_SHEETS':
        return ['sheet_updated', 'row_added'];
      default:
        return ['webhook_received', 'event_triggered'];
    }
  };

  const getActionTypes = () => {
    return [
      { value: 'create_task', label: 'Create Task' },
      { value: 'send_email', label: 'Send Email' },
      { value: 'call_webhook', label: 'Call Webhook' },
      { value: 'update_database', label: 'Update Database' },
    ];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-sm">Workflows - {integration.name}</DialogTitle>
          <DialogDescription className="text-[11px] text-muted-foreground">
            Manage workflows for this integration. Workflows define what happens when events are triggered.
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-[calc(90vh-120px)] gap-4">
          {/* Workflows List */}
          <div className="w-1/3 border-r pr-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-medium text-foreground">Workflows</h3>
              <Button
                size="xs"
                variant="outline"
                onClick={() => {
                  setEditingWorkflow(null);
                  resetForm();
                  setIsCreating(true);
                }}
              >
                <Plus className="mr-1 h-3 w-3" />
                New
              </Button>
            </div>
            <ScrollArea className="h-[calc(90vh-180px)]">
              <div className="space-y-2">
                {integration.workflows.map((workflow) => (
                  <Card
                    key={workflow.id}
                    className={`cursor-pointer border p-2 text-xs transition ${
                      editingWorkflow?.id === workflow.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/40'
                    }`}
                    onClick={() => {
                      setEditingWorkflow(workflow);
                      setIsCreating(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{workflow.name}</div>
                        <div className="mt-0.5 text-[10px] text-muted-foreground">
                          {workflow.triggerConfig.event} → {workflow.actionConfig.action}
                        </div>
                        <Badge
                          variant={workflow.isActive ? 'default' : 'secondary'}
                          className="mt-1 h-4 px-1 text-[9px]"
                        >
                          {workflow.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTestWorkflow(workflow);
                          }}
                          title="Test workflow"
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowExecutionLogs(true);
                            setEditingWorkflow(workflow);
                          }}
                          title="View execution logs"
                        >
                          <FileText className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWorkflow(workflow.id);
                          }}
                          title="Delete workflow"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                {integration.workflows.length === 0 && (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    No workflows yet. Create one to get started.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Workflow Editor / Execution Logs */}
          <div className="flex-1">
            <ScrollArea className="h-[calc(90vh-180px)]">
              <div className="space-y-4 pr-4">
                {showExecutionLogs && editingWorkflow ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-medium text-foreground">
                        Execution Logs - {editingWorkflow.name}
                      </h3>
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setShowExecutionLogs(false);
                        }}
                      >
                        <X className="mr-1 h-3 w-3" />
                        Close
                      </Button>
                    </div>
                    <div className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
                      <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                      <p>Execution logs will appear here after workflows are triggered.</p>
                      <p className="mt-1 text-[10px]">
                        Logs include execution time, status, and payload data.
                      </p>
                    </div>
                  </div>
                ) : isCreating || editingWorkflow ? (
                  <>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Workflow Name</Label>
                      <Input
                        value={workflowName}
                        onChange={(e) => setWorkflowName(e.target.value)}
                        placeholder="Order Processing Workflow"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px]">Trigger Event</Label>
                      <Select value={triggerEvent} onValueChange={setTriggerEvent}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select trigger event" />
                        </SelectTrigger>
                        <SelectContent>
                          {getTriggerEvents().map((event) => (
                            <SelectItem key={event} value={event}>
                              {event.replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px]">Action Type</Label>
                      <Select value={actionType} onValueChange={setActionType}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent>
                          {getActionTypes().map((action) => (
                            <SelectItem key={action.value} value={action.value}>
                              {action.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Trigger Filters */}
                    {triggerEvent && (
                      <div className="space-y-2 rounded-md border p-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-[11px]">Trigger Filters</Label>
                          <span className="text-[10px] text-muted-foreground">
                            (Optional - only trigger when these conditions match)
                          </span>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(triggerFilters).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2">
                              <Input
                                value={key}
                                readOnly
                                className="h-7 flex-1 font-mono text-[10px]"
                              />
                              <span className="text-[10px] text-muted-foreground">=</span>
                              <Input
                                value={String(value)}
                                readOnly
                                className="h-7 flex-1 font-mono text-[10px]"
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => {
                                  const newFilters = { ...triggerFilters };
                                  delete newFilters[key];
                                  setTriggerFilters(newFilters);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          <div className="flex items-center gap-2">
                            <Input
                              value={filterKey}
                              onChange={(e) => setFilterKey(e.target.value)}
                              placeholder="Filter key (e.g., event_type)"
                              className="h-7 flex-1 text-[10px]"
                            />
                            <span className="text-[10px] text-muted-foreground">=</span>
                            <Input
                              value={filterValue}
                              onChange={(e) => setFilterValue(e.target.value)}
                              placeholder="Filter value (e.g., order.created)"
                              className="h-7 flex-1 text-[10px]"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-[10px]"
                              onClick={() => {
                                if (filterKey.trim() && filterValue.trim()) {
                                  setTriggerFilters({
                                    ...triggerFilters,
                                    [filterKey.trim()]: filterValue.trim(),
                                  });
                                  setFilterKey('');
                                  setFilterValue('');
                                }
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Parameters */}
                    {actionType && (
                      <div className="space-y-2 rounded-md border p-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-[11px]">Action Parameters</Label>
                          <span className="text-[10px] text-muted-foreground">
                            (Configure what the action should do)
                          </span>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(actionParams).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2">
                              <Input
                                value={key}
                                readOnly
                                className="h-7 flex-1 font-mono text-[10px]"
                              />
                              <span className="text-[10px] text-muted-foreground">:</span>
                              <Input
                                value={String(value)}
                                readOnly
                                className="h-7 flex-1 font-mono text-[10px]"
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => {
                                  const newParams = { ...actionParams };
                                  delete newParams[key];
                                  setActionParams(newParams);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          <div className="flex items-center gap-2">
                            <Input
                              value={paramKey}
                              onChange={(e) => setParamKey(e.target.value)}
                              placeholder={
                                actionType === 'create_task'
                                  ? 'Parameter (e.g., task_name)'
                                  : 'Parameter key'
                              }
                              className="h-7 flex-1 text-[10px]"
                            />
                            <span className="text-[10px] text-muted-foreground">:</span>
                            <Input
                              value={paramValue}
                              onChange={(e) => setParamValue(e.target.value)}
                              placeholder={
                                actionType === 'create_task'
                                  ? 'Value (e.g., Process Order)'
                                  : 'Parameter value'
                              }
                              className="h-7 flex-1 text-[10px]"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-[10px]"
                              onClick={() => {
                                if (paramKey.trim() && paramValue.trim()) {
                                  setActionParams({
                                    ...actionParams,
                                    [paramKey.trim()]: paramValue.trim(),
                                  });
                                  setParamKey('');
                                  setParamValue('');
                                }
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          {actionType === 'create_task' && (
                            <div className="mt-2 rounded bg-muted/40 p-2 text-[10px] text-muted-foreground">
                              <p className="mb-1 font-medium text-foreground">Example for create_task:</p>
                              <ul className="ml-4 list-disc space-y-0.5">
                                <li>task_name: Process Order</li>
                                <li>task_description: Handle incoming order</li>
                                <li>task_fields: JSON array of field definitions</li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingWorkflow(null);
                          setIsCreating(false);
                          resetForm();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="button" size="sm" onClick={handleSaveWorkflow}>
                        {editingWorkflow ? 'Save Changes' : 'Create Workflow'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Select a workflow to edit or create a new one.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

