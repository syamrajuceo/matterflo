import { create } from 'zustand';
import type { IFlow, IFlowLevel, IFlowBranch } from '../types/flow.types';

interface FlowBuilderState {
  // Current flow being edited
  currentFlow: IFlow | null;
  setCurrentFlow: (flow: IFlow | null) => void;

  // Selected level for editing
  selectedLevel: IFlowLevel | null;
  setSelectedLevel: (level: IFlowLevel | null) => void;

  // Selected branch for editing
  selectedBranch: IFlowBranch | null;
  setSelectedBranch: (branch: IFlowBranch | null) => void;

  // Unsaved changes flag
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;

  // Level being dragged
  draggedLevel: IFlowLevel | null;
  setDraggedLevel: (level: IFlowLevel | null) => void;

  // Preview mode
  isPreviewMode: boolean;
  setIsPreviewMode: (value: boolean) => void;

  // Right panel collapsed state
  isPropertiesPanelCollapsed: boolean;
  setIsPropertiesPanelCollapsed: (value: boolean) => void;

  // BranchingRules panel state
  isBranchingRulesOpen: boolean;
  setIsBranchingRulesOpen: (value: boolean) => void;

  // Actions - Level management
  addLevel: (level: IFlowLevel) => void;
  updateLevel: (levelId: string, updates: Partial<IFlowLevel>) => void;
  deleteLevel: (levelId: string) => void;
  reorderLevels: (levelIds: string[]) => void;

  // Actions - Branch management
  addBranch: (branch: IFlowBranch) => void;
  updateBranch: (branchId: string, updates: Partial<IFlowBranch>) => void;
  deleteBranch: (branchId: string) => void;

  // Triggers state
  triggers: Record<string, any[]>; // levelId -> triggers
  selectedTrigger: any | null;
  setTriggers: (levelId: string, triggers: any[]) => void;
  setSelectedTrigger: (trigger: any | null) => void;
}

export const useFlowBuilderStore = create<FlowBuilderState>((set) => ({
  currentFlow: null,
  setCurrentFlow: (flow) => set({ currentFlow: flow }),

  selectedLevel: null,
  setSelectedLevel: (level) => set({ selectedLevel: level }),

  selectedBranch: null,
  setSelectedBranch: (branch) => set({ selectedBranch: branch }),

  hasUnsavedChanges: false,
  setHasUnsavedChanges: (value) => set({ hasUnsavedChanges: value }),

  draggedLevel: null,
  setDraggedLevel: (level) => set({ draggedLevel: level }),

  isPreviewMode: false,
  setIsPreviewMode: (value) => set({ isPreviewMode: value }),

  isPropertiesPanelCollapsed: false,
  setIsPropertiesPanelCollapsed: (value) => set({ isPropertiesPanelCollapsed: value }),

  isBranchingRulesOpen: false,
  setIsBranchingRulesOpen: (value) => set({ isBranchingRulesOpen: value }),

  // Level actions
  addLevel: (level) =>
    set((state) => {
      if (!state.currentFlow) return state;
      return {
        currentFlow: {
          ...state.currentFlow,
          levels: [...state.currentFlow.levels, level].sort((a, b) => a.order - b.order),
        },
        hasUnsavedChanges: true,
      };
    }),

  updateLevel: (levelId, updates) =>
    set((state) => {
      if (!state.currentFlow) return state;
      return {
        currentFlow: {
          ...state.currentFlow,
          levels: state.currentFlow.levels.map((l) => (l.id === levelId ? { ...l, ...updates } : l)),
        },
        hasUnsavedChanges: true,
      };
    }),

  deleteLevel: (levelId) =>
    set((state) => {
      if (!state.currentFlow) return state;
      return {
        currentFlow: {
          ...state.currentFlow,
          levels: state.currentFlow.levels.filter((l) => l.id !== levelId),
          branches: state.currentFlow.branches.filter(
            (b) => b.fromLevelId !== levelId && b.toLevelId !== levelId
          ),
        },
        hasUnsavedChanges: true,
      };
    }),

  reorderLevels: (levelIds) =>
    set((state) => {
      if (!state.currentFlow) return state;
      
      // Get levels in the new order
      const reorderedLevels = levelIds
        .map((id) => state.currentFlow!.levels.find((l) => l.id === id))
        .filter(Boolean) as IFlowLevel[];
      
      // Update order property based on new position
      // This ensures the order property matches the array position
      const levelsWithUpdatedOrder = reorderedLevels.map((level, index) => ({
        ...level,
        order: index + 1,
      }));

      // Also preserve any levels that weren't in the reorder list (shouldn't happen, but safety)
      const reorderedIds = new Set(levelIds);
      const otherLevels = state.currentFlow.levels.filter((l) => !reorderedIds.has(l.id));

      return {
        currentFlow: {
          ...state.currentFlow,
          // Put reordered levels first, then any others
          levels: [...levelsWithUpdatedOrder, ...otherLevels],
        },
        hasUnsavedChanges: true,
      };
    }),

  // Branch actions
  addBranch: (branch) =>
    set((state) => {
      if (!state.currentFlow) return state;
      return {
        currentFlow: {
          ...state.currentFlow,
          branches: [...state.currentFlow.branches, branch],
        },
        hasUnsavedChanges: true,
      };
    }),

  updateBranch: (branchId, updates) =>
    set((state) => {
      if (!state.currentFlow) return state;
      return {
        currentFlow: {
          ...state.currentFlow,
          branches: state.currentFlow.branches.map((b) => (b.id === branchId ? { ...b, ...updates } : b)),
        },
        hasUnsavedChanges: true,
      };
    }),

  deleteBranch: (branchId) =>
    set((state) => {
      if (!state.currentFlow) return state;
      return {
        currentFlow: {
          ...state.currentFlow,
          branches: state.currentFlow.branches.filter((b) => b.id !== branchId),
        },
        hasUnsavedChanges: true,
      };
    }),

  // Triggers state
  triggers: {},
  selectedTrigger: null,
  setTriggers: (levelId, triggers) =>
    set((state) => ({
      triggers: {
        ...state.triggers,
        [levelId]: triggers,
      },
    })),
  setSelectedTrigger: (trigger) => set({ selectedTrigger: trigger }),
}));

