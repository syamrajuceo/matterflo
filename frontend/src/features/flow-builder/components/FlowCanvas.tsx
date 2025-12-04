import { Plus, GripVertical } from 'lucide-react';
import { useFlowBuilderStore } from '../store/flowBuilderStore';
import { FlowLevel } from './FlowLevel';
import { flowService } from '../services/flow.service';
import type { IFlowLevel } from '../types/flow.types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useState } from 'react';
import { taskService } from '../../task-builder/services/task.service';
import type { ITask } from '../../task-builder/types/task.types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';

export function FlowCanvas() {
  const {
    currentFlow,
    selectedLevel,
    setSelectedLevel,
    addLevel,
    deleteLevel,
    reorderLevels,
    setHasUnsavedChanges,
  } = useFlowBuilderStore();

  const { showToast } = useToast();
  const isReadOnly = currentFlow?.status === 'PUBLISHED';

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [taskSearch, setTaskSearch] = useState('');
  const [availableTasks, setAvailableTasks] = useState<ITask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [taskDialogLevelId, setTaskDialogLevelId] = useState<string | null>(null);
  const [roleInput, setRoleInput] = useState('');
  const [roleDialogLevelId, setRoleDialogLevelId] = useState<string | null>(null);

  useEffect(() => {
    if (!isTaskDialogOpen) return;

    const loadTasks = async () => {
      try {
        setIsLoadingTasks(true);
        const response = await taskService.listTasks({
          limit: 50,
          search: taskSearch || undefined,
        });
        setAvailableTasks(response.tasks ?? (response as any).items ?? []);
      } catch (error) {
        console.error('Failed to load tasks for selection:', error);
        showToast({
          title: 'Failed to load tasks',
          description: 'Please try again in a moment.',
          status: 'error',
        });
      } finally {
        setIsLoadingTasks(false);
      }
    };

    void loadTasks();
  }, [isTaskDialogOpen, taskSearch]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleInsertLevel = async (afterOrder?: number) => {
    if (!currentFlow || isReadOnly) return;

    // Work with levels sorted by their current order
    const sorted = [...currentFlow.levels].sort((a, b) => a.order - b.order);

    let newOrder: number;

    if (afterOrder === undefined || sorted.length === 0) {
      // Append at the end if no position specified
      const lastOrder = sorted[sorted.length - 1]?.order ?? 0;
      newOrder = lastOrder + 1;
    } else {
      const index = sorted.findIndex((l) => l.order === afterOrder);
      const current = sorted[index];
      const next = sorted[index + 1];

      // Place the new level between current and next using a midpoint order
      const currentOrder = current?.order ?? 0;
      const nextOrder = next?.order ?? currentOrder + 2;
      newOrder = (currentOrder + nextOrder) / 2;
    }

    const tempLevel = {
      id: `temp-${Date.now()}`,
      name: `Level ${sorted.length + 1}`,
      order: newOrder,
      flowId: currentFlow.id,
      config: {},
      tasks: [],
      roles: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addLevel(tempLevel);
    setSelectedLevel(tempLevel);
    setHasUnsavedChanges(true);
  };

  const handleDeleteLevel = async (levelId: string) => {
    if (!currentFlow || isReadOnly) return;
    if (!confirm('Are you sure you want to delete this level?')) return;

    try {
      if (currentFlow.id && !levelId.startsWith('temp-')) {
        await flowService.deleteLevel(currentFlow.id, levelId);
      }
      deleteLevel(levelId);
      if (selectedLevel?.id === levelId) {
        setSelectedLevel(null);
      }
      setHasUnsavedChanges(true);
      showToast({
        title: 'Level deleted',
        description: 'The level has been removed from this flow.',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to delete level:', error);
      showToast({
        title: 'Failed to delete level',
        description: 'Please try again after reloading the flow.',
        status: 'error',
      });
    }
  };

  const handleOpenTaskDialog = (levelId: string) => {
    setTaskDialogLevelId(levelId);
    setIsTaskDialogOpen(true);
  };

  const handleSelectTask = async (task: ITask) => {
    if (!currentFlow || !taskDialogLevelId) return;
    try {
      await flowService.addTaskToLevel(currentFlow.id, taskDialogLevelId, {
        taskId: task.id,
      });
      const updatedFlow = await flowService.getFlow(currentFlow.id);
      setHasUnsavedChanges(true);
      useFlowBuilderStore.getState().setCurrentFlow(updatedFlow);
      setIsTaskDialogOpen(false);
      setTaskSearch('');
      showToast({
        title: 'Task added',
        description: `"${task.name}" was added to this level.`,
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to add task to level:', error);
      showToast({
        title: 'Failed to add task',
        description: 'Please try again after reloading the flow.',
        status: 'error',
      });
    }
  };

  const handleOpenRoleDialog = (levelId: string) => {
    setRoleDialogLevelId(levelId);
    setRoleInput('');
    setIsRoleDialogOpen(true);
  };

  const handleAddRoleToLevel = async () => {
    if (!currentFlow || !roleDialogLevelId || !roleInput.trim()) return;
    try {
      await flowService.addRoleToLevel(currentFlow.id, roleDialogLevelId, roleInput.trim());
      const updatedFlow = await flowService.getFlow(currentFlow.id);
      setHasUnsavedChanges(true);
      useFlowBuilderStore.getState().setCurrentFlow(updatedFlow);
      setIsRoleDialogOpen(false);
      setRoleInput('');
      showToast({
        title: 'Role added',
        description: `Role "${roleInput.trim()}" was added to this level.`,
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to add role to level:', error);
      showToast({
        title: 'Failed to add role',
        description: 'Please try again after reloading the flow.',
        status: 'error',
      });
    }
  };

  const handleSettings = (level: IFlowLevel) => {
    setSelectedLevel(level);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!currentFlow || !over || active.id === over.id) {
      return;
    }

    const sortedLevels = [...(currentFlow.levels || [])].sort((a, b) => a.order - b.order);
    const oldIndex = sortedLevels.findIndex((level) => level.id === active.id);
    const newIndex = sortedLevels.findIndex((level) => level.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newOrder = arrayMove(sortedLevels, oldIndex, newIndex);
    const newLevelIds = newOrder.map((level) => level.id);

    // Update local state immediately for better UX
    reorderLevels(newLevelIds);
    
    // Mark as unsaved - let manual save handle the backend update
    // This avoids errors when temp levels or unsaved levels are present
    setHasUnsavedChanges(true);
  };

  const sortedLevels = currentFlow
    ? [...(currentFlow.levels || [])].sort((a, b) => a.order - b.order)
    : [];

  if (!currentFlow) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-foreground">No flow selected</p>
          <p className="text-xs text-muted-foreground">
            Choose a flow from the left panel or create a new one to start designing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background p-4 sm:p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:gap-6">
        {/* Canvas helper text */}
        <div className="flex items-center justify-center text-[11px] text-muted-foreground">
          {isReadOnly
            ? 'This flow is published and read only. Create or switch to a draft to change levels.'
            : 'Drag levels to reorder. Use the highlighted “Insert level” button between steps to add new ones.'}
        </div>

        {/* Level Cards with Drag and Drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedLevels.map((level) => level.id)}
            strategy={verticalListSortingStrategy}
          >
            {sortedLevels.map((level, index) => (
              <div key={level.id} className="space-y-3 py-1">
                <SortableLevelWrapper
                  level={level}
                  index={index}
                  totalLevels={sortedLevels.length}
                  isSelected={selectedLevel?.id === level.id}
                  readOnly={isReadOnly}
                  onSelect={() => setSelectedLevel(level)}
                  onDelete={() => handleDeleteLevel(level.id)}
                  onAddTask={() => handleOpenTaskDialog(level.id)}
                  onAddRole={() => handleOpenRoleDialog(level.id)}
                  onSettings={() => handleSettings(level)}
                  onInsertLevel={(order) => handleInsertLevel(order)}
                />

                {/* Single insert button between this level and the next (or after last) */}
                <div className="mt-4 mb-2 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isReadOnly}
                    className={`h-8 gap-1 rounded-full border px-4 text-xs font-medium shadow-sm ${
                      isReadOnly
                        ? 'cursor-not-allowed border-border bg-muted text-muted-foreground'
                        : 'border-primary/40 bg-primary/5 text-primary'
                    }`}
                    type="button"
                    onClick={() => !isReadOnly && handleInsertLevel(level.order)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Insert level
                  </Button>
                </div>
              </div>
            ))}
          </SortableContext>
        </DndContext>

        {/* Empty State */}
        {sortedLevels.length === 0 && (
          <div className="py-10 text-center text-xs text-muted-foreground">
            <div className="mb-3">No levels yet.</div>
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 rounded-full border border-primary/40 bg-primary/5 px-4 text-xs font-medium text-primary shadow-sm"
                type="button"
                onClick={() => handleInsertLevel()}
              >
                <Plus className="h-3.5 w-3.5" />
                Insert first level
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Task selection dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Select task to add</DialogTitle>
            <DialogDescription>
              Choose a task from the list below to assign it to this level.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Search tasks..."
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
            />
            <ScrollArea className="h-60 rounded-md border">
              <div className="divide-y">
                {isLoadingTasks ? (
                  <div className="p-3 text-sm text-muted-foreground">Loading tasks...</div>
                ) : availableTasks.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">No tasks found.</div>
                ) : (
                  availableTasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => handleSelectTask(task)}
                      className="flex w-full items-start justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <div>
                        <div className="font-medium text-foreground">{task.name}</div>
                        {task.description && (
                          <div className="text-xs text-muted-foreground">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Role add dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add role to level</DialogTitle>
            <DialogDescription>
              Enter a role identifier (e.g. `manager`, `approver`) to attach it to this level.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Role ID or name"
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setIsRoleDialogOpen(false);
                  setRoleInput('');
                }}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleAddRoleToLevel} disabled={!roleInput.trim()}>
                Add Role
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Wrapper component to make each level sortable
interface SortableLevelWrapperProps {
  level: IFlowLevel;
  index: number;
  totalLevels: number;
  isSelected: boolean;
  readOnly: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onAddTask: () => void;
  onAddRole: () => void;
  onSettings: () => void;
  onInsertLevel: (order: number) => void;
}

function SortableLevelWrapper({
  level,
  index,
  totalLevels,
  isSelected,
  readOnly,
  onSelect,
  onDelete,
  onAddTask,
  onAddRole,
  onSettings,
  onInsertLevel,
}: SortableLevelWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: level.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-start gap-2">
        {/* Drag Handle */}
        <div
          {...(!readOnly ? { ...attributes, ...listeners } : {})}
          className={`mt-4 p-1 transition ${
            readOnly
              ? 'cursor-default text-muted-foreground'
              : 'cursor-grab text-gray-500 hover:text-gray-300 active:cursor-grabbing'
          }`}
          title={readOnly ? 'Published flow – drag disabled' : 'Drag to reorder'}
        >
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Level Card */}
        <div className="flex-1">
          <FlowLevel
            level={level}
            displayOrder={index + 1}
            isSelected={isSelected}
            readOnly={readOnly}
            onSelect={onSelect}
            onDelete={onDelete}
            onAddTask={onAddTask}
            onAddRole={onAddRole}
            onSettings={onSettings}
          />
        </div>
      </div>
    </div>
  );
}

