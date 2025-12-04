import { create } from 'zustand';
import type { IIntegration, IIntegrationWorkflow } from '../services/integrations.service';

interface IntegrationsState {
  integrations: IIntegration[];
  selectedIntegration: IIntegration | null;
  selectedWorkflow: IIntegrationWorkflow | null;
  isLoading: boolean;

  setIntegrations: (integrations: IIntegration[]) => void;
  setSelectedIntegration: (integration: IIntegration | null) => void;
  setSelectedWorkflow: (workflow: IIntegrationWorkflow | null) => void;
  setIsLoading: (loading: boolean) => void;

  addIntegration: (integration: IIntegration) => void;
  updateIntegration: (id: string, updates: Partial<IIntegration>) => void;
  removeIntegration: (id: string) => void;
  addWorkflow: (integrationId: string, workflow: IIntegrationWorkflow) => void;
  updateWorkflow: (integrationId: string, workflowId: string, updates: Partial<IIntegrationWorkflow>) => void;
  removeWorkflow: (integrationId: string, workflowId: string) => void;
}

export const useIntegrationsStore = create<IntegrationsState>((set) => ({
  integrations: [],
  selectedIntegration: null,
  selectedWorkflow: null,
  isLoading: false,

  setIntegrations: (integrations) => set({ integrations }),
  setSelectedIntegration: (integration) => set({ selectedIntegration: integration }),
  setSelectedWorkflow: (workflow) => set({ selectedWorkflow: workflow }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  addIntegration: (integration) =>
    set((state) => ({
      integrations: [...state.integrations, integration],
    })),

  updateIntegration: (id, updates) =>
    set((state) => ({
      integrations: state.integrations.map((int) =>
        int.id === id ? { ...int, ...updates } : int
      ),
      selectedIntegration:
        state.selectedIntegration?.id === id
          ? { ...state.selectedIntegration, ...updates }
          : state.selectedIntegration,
    })),

  removeIntegration: (id) =>
    set((state) => ({
      integrations: state.integrations.filter((int) => int.id !== id),
      selectedIntegration:
        state.selectedIntegration?.id === id ? null : state.selectedIntegration,
    })),

  addWorkflow: (integrationId, workflow) =>
    set((state) => ({
      integrations: state.integrations.map((int) =>
        int.id === integrationId
          ? { ...int, workflows: [...int.workflows, workflow] }
          : int
      ),
      selectedIntegration:
        state.selectedIntegration?.id === integrationId
          ? {
              ...state.selectedIntegration,
              workflows: [...state.selectedIntegration.workflows, workflow],
            }
          : state.selectedIntegration,
    })),

  updateWorkflow: (integrationId, workflowId, updates) =>
    set((state) => ({
      integrations: state.integrations.map((int) =>
        int.id === integrationId
          ? {
              ...int,
              workflows: int.workflows.map((wf) =>
                wf.id === workflowId ? { ...wf, ...updates } : wf
              ),
            }
          : int
      ),
      selectedIntegration:
        state.selectedIntegration?.id === integrationId
          ? {
              ...state.selectedIntegration,
              workflows: state.selectedIntegration.workflows.map((wf) =>
                wf.id === workflowId ? { ...wf, ...updates } : wf
              ),
            }
          : state.selectedIntegration,
    })),

  removeWorkflow: (integrationId, workflowId) =>
    set((state) => ({
      integrations: state.integrations.map((int) =>
        int.id === integrationId
          ? {
              ...int,
              workflows: int.workflows.filter((wf) => wf.id !== workflowId),
            }
          : int
      ),
      selectedIntegration:
        state.selectedIntegration?.id === integrationId
          ? {
              ...state.selectedIntegration,
              workflows: state.selectedIntegration.workflows.filter(
                (wf) => wf.id !== workflowId
              ),
            }
          : state.selectedIntegration,
    })),
}));

