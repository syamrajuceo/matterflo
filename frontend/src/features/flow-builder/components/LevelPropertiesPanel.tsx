import { X, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useFlowBuilderStore } from '../store/flowBuilderStore';
import { flowService } from '../services/flow.service';
import { useToast } from '@/components/ui/use-toast';

export function LevelPropertiesPanel() {
  const {
    selectedLevel,
    currentFlow,
    setCurrentFlow,
    setSelectedLevel,
    updateLevel,
    setHasUnsavedChanges,
    isPropertiesPanelCollapsed,
  } = useFlowBuilderStore();

  const { showToast } = useToast();

  const [name, setName] = useState(selectedLevel?.name || '');
  const [description, setDescription] = useState(selectedLevel?.description || '');

  // Update form when selected level changes
  useEffect(() => {
    if (selectedLevel) {
      setName(selectedLevel.name);
      setDescription(selectedLevel.description || '');
    }
  }, [selectedLevel]);

  if (isPropertiesPanelCollapsed || !selectedLevel) {
    return null;
  }

  const handleSave = async () => {
    if (!currentFlow || !selectedLevel) return;

    try {
      // If it's a temp level, it will be saved when the flow is saved
      // If it's an existing level, save to backend now
      if (currentFlow.id && !selectedLevel.id.startsWith('temp-')) {
        // Save to backend
        const updatedFlow = await flowService.updateLevel(currentFlow.id, selectedLevel.id, {
          name,
          description,
        });
        
        // Preserve the current order from local state before updating
        const currentState = useFlowBuilderStore.getState().currentFlow;
        if (currentState) {
          // Merge: use updated flow data but preserve the order from current state
          const currentOrder = currentState.levels.map(l => l.id);
          const updatedLevels = currentOrder
            .map(id => {
              const backendLevel = updatedFlow.levels.find(l => l.id === id);
              if (!backendLevel) return null;
              
              // Use backend data (it has the updated name/description we just saved)
              return backendLevel;
            })
            .filter(Boolean) as IFlowLevel[];
          
          // Update the flow with merged data
          setCurrentFlow({
            ...updatedFlow,
            levels: updatedLevels,
          });
          
          // Update selected level to match the updated data
          const updatedLevel = updatedLevels.find((l) => l.id === selectedLevel.id);
          if (updatedLevel) {
            setSelectedLevel(updatedLevel);
          }
        } else {
          // Fallback: use the updated flow as-is
        setCurrentFlow(updatedFlow);
        const updatedLevel = updatedFlow.levels.find((l) => l.id === selectedLevel.id);
        if (updatedLevel) {
          setSelectedLevel(updatedLevel);
          }
        }
        
        setHasUnsavedChanges(false);
        showToast({
          title: 'Level saved',
          description: 'Level properties have been updated.',
          status: 'success',
        });
      } else {
        // Temp level - changes are already in local state, will be saved with flow
        setHasUnsavedChanges(true);
        showToast({
          title: 'Level changes saved locally',
          description: 'Click "Save" on the flow to persist these changes.',
          status: 'warning',
        });
      }
    } catch (error: any) {
      console.error('Failed to save level:', error);
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to save level';
      showToast({
        title: 'Failed to save level',
        description: errorMessage,
        status: 'error',
      });
    }
  };

  const handleClose = () => {
    setSelectedLevel(null);
  };

  return (
    <div className="h-full flex flex-col border-l bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="text-lg font-semibold text-foreground">Level Properties</h3>
        <button
          onClick={handleClose}
          className="rounded p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Level Name */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">Level Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              const newName = e.target.value;
              setName(newName);
              // Update in real-time as user types
              if (selectedLevel) {
                updateLevel(selectedLevel.id, { name: newName });
              }
            }}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter level name"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">Description</label>
          <textarea
            value={description}
            onChange={(e) => {
              const newDescription = e.target.value;
              setDescription(newDescription);
              // Update in real-time as user types
              if (selectedLevel) {
                updateLevel(selectedLevel.id, { description: newDescription });
              }
            }}
            rows={4}
            className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter level description"
          />
        </div>

        {/* Level Info */}
        <div className="border-t pt-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">Order:</span> {selectedLevel.order}
            </div>
            <div>
              <span className="font-medium text-foreground">Tasks:</span> {selectedLevel.tasks.length}
            </div>
            <div>
              <span className="font-medium text-foreground">Roles:</span> {selectedLevel.roles.length}
            </div>
            {currentFlow && (
              <div>
                <span className="font-medium text-foreground">Branches:</span>{' '}
                {currentFlow.branches.filter((b) => b.fromLevelId === selectedLevel.id).length}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="border-t p-4">
        <button
          onClick={handleSave}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </div>
  );
}

