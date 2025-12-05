import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Save, Eye, EyeOff, ChevronRight, ChevronLeft, Send, History, Plus } from 'lucide-react';
import { useTaskBuilderStore } from '../store/taskBuilderStore';
import { taskService } from '../services/task.service';
import { TaskSidebar } from './TaskSidebar';
import { FieldPalette } from './FieldPalette';
import { FormCanvas } from './FormCanvas';
import { FieldPropertiesPanel } from './FieldPropertiesPanel';
import { TaskPreview } from './TaskPreview';
import { VersionHistory } from '../../versions/components/VersionHistory';
import type { ITaskField, FieldType } from '../types/task.types';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Get store instance for accessing state outside of component
const taskBuilderStore = useTaskBuilderStore;

export function TaskBuilder() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const hasAttemptedCreateRef = useRef(false);
  const isVersionHistoryOpen = useState(false)[0];
  const setIsVersionHistoryOpen = useState(false)[1];
  const {
    currentTask,
    setCurrentTask,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isPropertiesPanelCollapsed,
    setIsPropertiesPanelCollapsed,
    isPreviewMode,
    setIsPreviewMode,
    addField,
  } = useTaskBuilderStore();

  const loadTask = async (taskId: string) => {
    try {
      const task = await taskService.getTask(taskId);
      setCurrentTask(task);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to load task:', error);
      showToast({
        title: 'Failed to load task',
        description: 'Please try again or select a different task.',
        status: 'error',
      });
      navigate('/tasks');
    }
  };

  const handleCreateNewTask = async () => {
    // Prevent multiple simultaneous creation attempts
    if (isCreating || hasAttemptedCreateRef.current) {
      console.log('[TaskBuilder] Skipping task creation - already creating or attempted:', {
        isCreating,
        hasAttemptedCreate: hasAttemptedCreateRef.current,
      });
      return;
    }

    setIsCreating(true);
    hasAttemptedCreateRef.current = true;
    
    try {
      const newTask = await taskService.createTask({
        name: 'New Task',
        description: '',
      });
      console.log('[TaskBuilder] Created new task:', newTask);
      setCurrentTask(newTask);
      setHasUnsavedChanges(false);
      
      // Dispatch event to refresh task list in sidebar
      window.dispatchEvent(new CustomEvent('task:created', { detail: { taskId: newTask.id } }));
      
      navigate(`/tasks/${newTask.id}`, { replace: true });
    } catch (error: any) {
      console.error('Failed to create task:', error);
      
      // Handle rate limit errors specifically
      if (error?.response?.status === 429) {
        showToast({
          title: 'Rate limit exceeded',
          description: 'Please wait a moment and try again.',
          status: 'error',
        });
        // Reset the flag after a delay to allow retry
        setTimeout(() => {
          hasAttemptedCreateRef.current = false;
        }, 5000);
      } else {
        const errorMessage =
          error?.response?.data?.error?.message || error?.message || 'Failed to create task';
        showToast({
          title: 'Failed to create task',
          description: errorMessage,
          status: 'error',
        });
        hasAttemptedCreateRef.current = false; // Allow retry for non-rate-limit errors
      }
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    // Only load existing tasks, don't auto-create new ones
    if (id && id !== 'new') {
      // Reset flags when loading an existing task
      hasAttemptedCreateRef.current = false;
      loadTask(id);
    } else if (location.pathname === '/tasks/new' || id === 'new') {
      // On /tasks/new route, clear current task and show empty state
      // Don't auto-create - user must click a button to create
      if (currentTask) {
        setCurrentTask(null);
      }
      hasAttemptedCreateRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, location.pathname]);

  const handleSave = async () => {
    // Get the latest task state from the store
    const latestTask = taskBuilderStore.getState().currentTask;
    if (!latestTask) return;

    try {
      if (latestTask.id) {
        // Get current fields sorted by their order property
        const allFields = [...latestTask.fields].sort((a, b) => a.order - b.order);

        // First, save any new fields (those with temp- IDs)
        const tempFields = allFields.filter((field) => field.id.startsWith('temp-'));
        const tempToRealIdMap = new Map<string, string>();

        for (const field of tempFields) {
          try {
            const updatedTask = await taskService.addField(latestTask.id, {
              type: field.type,
              label: field.label,
              placeholder: field.placeholder,
              required: field.required,
              validation: field.validation,
              conditionalLogic: field.conditionalLogic,
              order: field.order,
            });

            // Find the newly created field (it will have a real ID)
            // Strategy: find a field that matches by label and type but has a real ID
            const newField = updatedTask.fields.find(
              (f) =>
                f.label === field.label &&
                f.type === field.type &&
                !f.id.startsWith('temp-') &&
                !Array.from(tempToRealIdMap.values()).includes(f.id)
            );

            if (newField) {
              tempToRealIdMap.set(field.id, newField.id);
            }
          } catch (error: any) {
            console.error(`Failed to save temp field ${field.id}:`, error);
            // Continue with other fields
          }
        }

        // Reload task after creating all temp fields to get accurate field list
        let taskAfterFieldCreation = latestTask;
        if (tempFields.length > 0) {
          try {
            taskAfterFieldCreation = await taskService.getTask(latestTask.id);
            setCurrentTask(taskAfterFieldCreation);
          } catch (error) {
            console.error('Failed to reload task after field creation:', error);
          }
        }

        // Update field order if needed
        // Only reorder if we have fields and the order might have changed
        if (allFields.length > 0) {
          // Get the current field order from the reloaded task
          const currentFieldIds = taskAfterFieldCreation.fields.map((f) => f.id);
          
          // Build the desired field order based on allFields
          const desiredFieldIds = allFields
            .map((field) => {
              // Use real ID if we have a mapping, otherwise use the field's ID
              return tempToRealIdMap.get(field.id) || field.id;
            })
            .filter((id) => !id.startsWith('temp-') && currentFieldIds.includes(id)); // Only include IDs that exist in the database

          // Only reorder if the order is different
          const orderChanged = 
            desiredFieldIds.length !== currentFieldIds.length ||
            desiredFieldIds.some((id, index) => id !== currentFieldIds[index]);

          if (orderChanged && desiredFieldIds.length > 0) {
            try {
              await taskService.reorderFields(latestTask.id, desiredFieldIds);
            } catch (error: any) {
              console.error('Failed to reorder fields:', error);
              // Don't throw - field order is not critical, fields are already saved
            }
          }
        }

        // Update task metadata if changed
        const storeTask = taskBuilderStore.getState().currentTask;
        if (storeTask) {
          const taskNameChanged = storeTask.name !== latestTask.name;
          const taskDescChanged = storeTask.description !== latestTask.description;

          if (taskNameChanged || taskDescChanged) {
            await taskService.updateTask(latestTask.id, {
              name: storeTask.name,
              description: storeTask.description,
            });
            // Dispatch event when task name/description is updated
            window.dispatchEvent(new CustomEvent('task:updated', { detail: { taskId: latestTask.id } }));
          }
        }

        // Final reload to get all updated data
        const finalTask = await taskService.getTask(latestTask.id);
        setCurrentTask(finalTask);
        setHasUnsavedChanges(false);
        
        // Dispatch event to refresh task list in sidebar
        window.dispatchEvent(new CustomEvent('task:saved', { detail: { taskId: latestTask.id } }));
        
        showToast({
          title: 'Task saved',
          description: 'Your task changes have been saved successfully.',
          status: 'success',
        });
      }
    } catch (error: any) {
      console.error('Failed to save task:', error);
      const errorMessage =
        error?.response?.data?.error?.message || error?.message || 'Failed to save task';
      showToast({
        title: 'Failed to save task',
        description: errorMessage,
        status: 'error',
      });
    }
  };

  const handlePublish = async () => {
    if (!currentTask) return;
    if (!confirm('Are you sure you want to publish this task? Published tasks cannot be edited.')) {
      return;
    }

    try {
      await taskService.publishTask(currentTask.id);
      const updatedTask = await taskService.getTask(currentTask.id);
      setCurrentTask(updatedTask);
      setHasUnsavedChanges(false);
      showToast({
        title: 'Task published',
        description: 'This task is now published and cannot be edited.',
        status: 'success',
      });
    } catch (error: any) {
      console.error('Failed to publish task:', error);
      const errorMessage =
        error?.response?.data?.error?.message || error?.message || 'Failed to publish task';
      showToast({
        title: 'Failed to publish task',
        description: errorMessage,
        status: 'error',
      });
    }
  };

  const handleAddField = (type: FieldType) => {
    if (!currentTask) return;

    const newField: ITaskField = {
      id: `temp-${Date.now()}`,
      type,
      label: `New ${type} Field`,
      required: false,
      order: currentTask.fields.length,
    };

    addField(newField);
    setHasUnsavedChanges(true);
  };

  return (
    <div className="flex h-screen flex-col -m-8">
      {/* Top Bar */}
      <div className="flex h-16 items-center justify-between border-b bg-card px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Task Builder</h1>
          {hasUnsavedChanges && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
              Unsaved changes
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          {currentTask && currentTask.id && (
            <Button
              onClick={() => setIsVersionHistoryOpen(true)}
              variant="outline"
              size="default"
            >
              <History className="size-4" />
              Version History
            </Button>
          )}
          <Button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            variant="outline"
            size="default"
          >
            {isPreviewMode ? (
              <>
                <EyeOff className="size-4" />
                Exit Preview
              </>
            ) : (
              <>
                <Eye className="size-4" />
                Preview
              </>
            )}
          </Button>
          {!currentTask && (location.pathname === '/tasks/new' || id === 'new') ? (
            <Button
              onClick={handleCreateNewTask}
              disabled={isCreating}
              size="default"
            >
              <Plus className="size-4" />
              {isCreating ? 'Creating...' : 'Create New Task'}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleSave}
                disabled={!hasUnsavedChanges || !currentTask}
                size="default"
              >
                <Save className="size-4" />
                Save
              </Button>
              {currentTask && currentTask.status === 'DRAFT' && (
                <Button
                  onClick={handlePublish}
                  variant="secondary"
                  size="default"
                >
                  <Send className="size-4" />
                  Publish
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden gap-4 p-4 bg-background">
        {/* Left Sidebar - Task Switcher */}
        <div className="w-64 flex-shrink-0">
          <TaskSidebar />
        </div>

        {/* Center - Field Palette (if not in preview) or Canvas */}
        {!isPreviewMode ? (
          <>
            <div className="w-20 flex-shrink-0">
              <FieldPalette onAddField={handleAddField} />
            </div>
            <div className="flex-1 min-w-0">
              {isCreating ? (
                <div className="flex h-full items-center justify-center rounded-lg border border-border/50 bg-card">
                  <div className="text-center space-y-2">
                    <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="text-sm text-muted-foreground">Creating new task...</p>
                  </div>
                </div>
              ) : (
                <FormCanvas />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 min-w-0">
            <TaskPreview />
          </div>
        )}

        {/* Right Sidebar - Field Properties */}
        {!isPreviewMode && (
          <>
            {!isPropertiesPanelCollapsed ? (
              <div className="w-80 flex-shrink-0">
                <FieldPropertiesPanel />
              </div>
            ) : (
              <Button
                onClick={() => setIsPropertiesPanelCollapsed(false)}
                variant="outline"
                size="icon"
                className="h-full"
              >
                <ChevronLeft className="size-4" />
              </Button>
            )}
          </>
        )}
      </div>

      {/* Version History Dialog */}
      {currentTask && currentTask.id && (
        <Dialog open={isVersionHistoryOpen} onOpenChange={setIsVersionHistoryOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Version History: {currentTask.name}</DialogTitle>
            </DialogHeader>
            <VersionHistory entityType="Task" entityId={currentTask.id} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

