import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Save, Eye, EyeOff, ChevronRight, ChevronLeft, Send } from 'lucide-react';
import { useTaskBuilderStore } from '../store/taskBuilderStore';
import { taskService } from '../services/task.service';
import { TaskSidebar } from './TaskSidebar';
import { FieldPalette } from './FieldPalette';
import { FormCanvas } from './FormCanvas';
import { FieldPropertiesPanel } from './FieldPropertiesPanel';
import { TaskPreview } from './TaskPreview';
import type { ITaskField, FieldType } from '../types/task.types';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Get store instance for accessing state outside of component
const taskBuilderStore = useTaskBuilderStore;

export function TaskBuilder() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
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
    setIsCreating(true);
    try {
      const newTask = await taskService.createTask({
        name: 'New Task',
        description: '',
      });
      setCurrentTask(newTask);
      setHasUnsavedChanges(false);
      navigate(`/tasks/${newTask.id}`, { replace: true });
    } catch (error: any) {
      console.error('Failed to create task:', error);
      const errorMessage =
        error?.response?.data?.error?.message || error?.message || 'Failed to create task';
      showToast({
        title: 'Failed to create task',
        description: errorMessage,
        status: 'error',
      });
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    // Check if we're on the /tasks/new route (id will be undefined)
    const isNewRoute = location.pathname === '/tasks/new' || id === 'new';
    
    if (id && id !== 'new') {
      loadTask(id);
    } else if (isNewRoute && !currentTask) {
      // Create new task only if we don't already have one
      handleCreateNewTask();
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
              setCurrentTask(updatedTask);
            }
          } catch (error: any) {
            console.error(`Failed to save temp field ${field.id}:`, error);
            // Continue with other fields
          }
        }

        // Update field order if needed
        if (allFields.length > 0) {
          const fieldIds = allFields.map((field) => {
            // Use real ID if we have a mapping, otherwise use the field's ID
            return tempToRealIdMap.get(field.id) || field.id;
          });

          // Filter out any temp IDs that weren't successfully created
          const validFieldIds = fieldIds.filter((id) => !id.startsWith('temp-'));

          if (validFieldIds.length > 0) {
            await taskService.reorderFields(latestTask.id, validFieldIds);
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
          }
        }

        // Final reload to get all updated data
        const finalTask = await taskService.getTask(latestTask.id);
        setCurrentTask(finalTask);
        setHasUnsavedChanges(false);
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
    </div>
  );
}

