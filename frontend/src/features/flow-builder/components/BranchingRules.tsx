import { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowRight, X } from 'lucide-react';
import { useFlowBuilderStore } from '../store/flowBuilderStore';
import { flowService } from '../services/flow.service';
import { useToast } from '@/components/ui/use-toast';
import { ConditionBuilder } from '../../trigger-builder/components/ConditionBuilder';
import type { IFlowBranch, IFlowLevel } from '../types/flow.types';
import type { ICondition, IConditionGroup } from '../../trigger-builder/types/condition.types';

interface BranchingRulesProps {
  level: IFlowLevel;
  onClose: () => void;
}

export function BranchingRules({ level, onClose }: BranchingRulesProps) {
  const {
    currentFlow,
    setCurrentFlow,
    selectedBranch,
    setSelectedBranch,
    addBranch,
    updateBranch,
    deleteBranch,
    setHasUnsavedChanges,
  } = useFlowBuilderStore();

  const { showToast } = useToast();

  const [branchName, setBranchName] = useState('');
  const [targetLevelId, setTargetLevelId] = useState('');
  const [conditions, setConditions] = useState<IConditionGroup | ICondition | null>(null);
  const [priority, setPriority] = useState(0);

  // Get available target levels (all levels after current level)
  const availableLevels =
    currentFlow?.levels
      .filter((l) => l.order > level.order)
      .sort((a, b) => a.order - b.order) || [];

  // Get branches from this level
  const levelBranches =
    currentFlow?.branches.filter((b) => b.fromLevelId === level.id) || [];

  useEffect(() => {
    if (selectedBranch) {
      setBranchName(selectedBranch.name);
      setTargetLevelId(selectedBranch.toLevelId);
      setConditions(selectedBranch.conditions || null);
      setPriority(selectedBranch.priority);
    } else {
      setBranchName('');
      setTargetLevelId('');
      setConditions(null);
      setPriority(0);
    }
  }, [selectedBranch]);

  const handleCreateBranch = async () => {
    if (!currentFlow || !targetLevelId) {
      showToast({
        title: 'Target level required',
        description: 'Please select a target level for this branch.',
        status: 'warning',
      });
      return;
    }

    if (!branchName.trim()) {
      showToast({
        title: 'Branch name required',
        description: 'Please enter a name for this branch.',
        status: 'warning',
      });
      return;
    }

    try {
      if (currentFlow.id && !currentFlow.id.startsWith('temp-')) {
        // Save to backend immediately
        const updatedFlow = await flowService.createBranch(currentFlow.id, {
          name: branchName,
          fromLevelId: level.id,
          toLevelId: targetLevelId,
          conditions: conditions || {},
          priority,
        });

        setCurrentFlow(updatedFlow);
        const newBranch = updatedFlow.branches.find(
          (b) => b.fromLevelId === level.id && b.toLevelId === targetLevelId && b.name === branchName
        );
        if (newBranch) {
          setSelectedBranch(newBranch);
        }
        setHasUnsavedChanges(false);
      } else {
        // Temp flow - create in local state
        const newBranch: IFlowBranch = {
          id: `temp-${Date.now()}`,
          name: branchName,
          fromLevelId: level.id,
          toLevelId: targetLevelId,
          conditions: conditions || {},
          priority,
          flowId: currentFlow.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        addBranch(newBranch);
        setSelectedBranch(newBranch);
        setHasUnsavedChanges(true);
      }

      // Reset form
      setBranchName('');
      setTargetLevelId('');
      setConditions(null);
      setPriority(0);
    } catch (error: any) {
      console.error('Failed to create branch:', error);
      const errorMessage =
        error?.response?.data?.error?.message || error?.message || 'Failed to create branch';
      showToast({
        title: 'Failed to create branch',
        description: errorMessage,
        status: 'error',
      });
    }
  };

  const handleUpdateBranch = async () => {
    if (!currentFlow || !selectedBranch) return;

    try {
      if (!selectedBranch.id.startsWith('temp-')) {
        await flowService.updateBranch(currentFlow.id, selectedBranch.id, {
          name: branchName,
          conditions: conditions || {},
          priority,
        });

        // Reload flow
        const updatedFlow = await flowService.getFlow(currentFlow.id);
        setCurrentFlow(updatedFlow);

        const updatedBranch = updatedFlow.branches.find((b) => b.id === selectedBranch.id);
        if (updatedBranch) {
          setSelectedBranch(updatedBranch);
        }

        setHasUnsavedChanges(false);
        showToast({
          title: 'Branch updated',
          description: 'Branch configuration has been updated.',
          status: 'success',
        });
      } else {
        // Temp branch - update local state
        updateBranch(selectedBranch.id, {
          name: branchName,
          toLevelId: targetLevelId,
          conditions: conditions || {},
          priority,
        });
        setHasUnsavedChanges(true);
        showToast({
          title: 'Branch changes saved locally',
          description: 'Click "Save" on the flow to persist these changes.',
          status: 'warning',
        });
      }
    } catch (error: any) {
      console.error('Failed to update branch:', error);
      const errorMessage =
        error?.response?.data?.error?.message || error?.message || 'Failed to update branch';
      showToast({
        title: 'Failed to update branch',
        description: errorMessage,
        status: 'error',
      });
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    if (!currentFlow) return;
    if (!confirm('Are you sure you want to delete this branch?')) return;

    try {
      if (!branchId.startsWith('temp-')) {
        await flowService.deleteBranch(currentFlow.id, branchId);
      }
      deleteBranch(branchId);
      if (selectedBranch?.id === branchId) {
        setSelectedBranch(null);
      }
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Failed to delete branch:', error);
      showToast({
        title: 'Failed to delete branch',
        description: 'Please try again after reloading the flow.',
        status: 'error',
      });
    }
  };

  const handleSelectBranch = (branch: IFlowBranch) => {
    setSelectedBranch(branch);
  };

  const getTargetLevelName = (levelId: string) => {
    return currentFlow?.levels.find((l) => l.id === levelId)?.name || 'Unknown';
  };

  return (
    <div className="h-full flex flex-col border-l bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Branching Rules</h3>
          <p className="mt-1 text-xs text-muted-foreground">Level: {level.name}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Existing Branches */}
        {levelBranches.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-foreground">Existing Branches</h4>
            <div className="space-y-2">
              {levelBranches.map((branch) => (
                <div
                  key={branch.id}
                  className={`cursor-pointer rounded-lg border bg-background p-3 transition ${
                    selectedBranch?.id === branch.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/60'
                  }`}
                  onClick={() => handleSelectBranch(branch)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">{branch.name}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {getTargetLevelName(branch.toLevelId)}
                        </span>
                      </div>
                      {branch.conditions && Object.keys(branch.conditions).length > 0 && (
                        <p className="text-xs text-muted-foreground">Has conditions</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        Priority: {branch.priority}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBranch(branch.id);
                      }}
                      className="rounded p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                      title="Delete branch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create/Edit Branch Form */}
        <div className="border-t pt-4">
          <h4 className="mb-3 text-sm font-medium text-foreground">
            {selectedBranch ? 'Edit Branch' : 'Create New Branch'}
          </h4>

          {/* Branch Name */}
          <div className="mb-3">
            <label className="mb-2 block text-sm font-medium text-foreground">
              Branch Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder="e.g., Approved Path, Rejected Path"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Target Level */}
          {!selectedBranch && (
            <div className="mb-3">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Target Level <span className="text-destructive">*</span>
              </label>
              <select
                value={targetLevelId}
                onChange={(e) => setTargetLevelId(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select target level...</option>
                {availableLevels.map((l) => (
                  <option key={l.id} value={l.id}>
                    Level {l.order}: {l.name}
                  </option>
                ))}
              </select>
              {availableLevels.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  No levels available after this level
                </p>
              )}
            </div>
          )}

          {/* Priority */}
          <div className="mb-3">
            <label className="mb-2 block text-sm font-medium text-foreground">Priority</label>
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
              min="0"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Lower numbers have higher priority. Branches are evaluated in priority order.
            </p>
          </div>

          {/* Conditions */}
          <div className="mb-3">
            <label className="mb-2 block text-sm font-medium text-foreground">
              Conditions (Optional)
            </label>
            <p className="mb-2 text-xs text-muted-foreground">
              Define conditions for when this branch should be taken. Leave empty for default
              branch.
            </p>
            <div className="rounded-lg border bg-background p-3">
              <ConditionBuilder
                value={conditions}
                onChange={(newConditions) => setConditions(newConditions)}
                availableFields={[]} // TODO: Get fields from level tasks
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {selectedBranch ? (
              <>
                <button
                  onClick={handleUpdateBranch}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-primary/90"
                >
                  Update Branch
                </button>
                <button
                  onClick={() => {
                    setSelectedBranch(null);
                    setBranchName('');
                    setTargetLevelId('');
                    setConditions(null);
                    setPriority(0);
                  }}
                  className="rounded-lg bg-muted px-4 py-2 text-sm text-foreground transition hover:bg-muted/80"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleCreateBranch}
                disabled={!targetLevelId || !branchName.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="w-4 h-4" />
                Create Branch
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

