import { create } from 'zustand';
import type { Dataset, DatasetSection } from '../services/dataset.service';

type DatasetMode = 'edit' | 'preview';

interface DatasetState {
  datasets: Dataset[];
  currentDataset: Dataset | null;
  selectedSection: DatasetSection | null;
  isLoading: boolean;
  mode: DatasetMode;

  setDatasets: (datasets: Dataset[]) => void;
  setCurrentDataset: (dataset: Dataset | null) => void;
  setSelectedSection: (section: DatasetSection | null) => void;
  setIsLoading: (loading: boolean) => void;
  setMode: (mode: DatasetMode) => void;

  removeDatasetLocal: (id: string) => void;

  addSectionLocal: (section: DatasetSection) => void;
  updateSectionLocal: (sectionId: string, updates: Partial<DatasetSection>) => void;
  deleteSectionLocal: (sectionId: string) => void;
  reorderSectionsLocal: (orderedIds: string[]) => void;
}

export const useDatasetStore = create<DatasetState>((set) => ({
  datasets: [],
  currentDataset: null,
  selectedSection: null,
  isLoading: false,
  mode: 'edit',

  setDatasets: (datasets) => set({ datasets }),
  setCurrentDataset: (dataset) => set({ currentDataset: dataset, selectedSection: null }),
  setSelectedSection: (section) => set({ selectedSection: section }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setMode: (mode) => set({ mode }),

  removeDatasetLocal: (id) =>
    set((state) => {
      const remaining = state.datasets.filter((d) => d.id !== id);
      const nextCurrent =
        state.currentDataset && state.currentDataset.id === id
          ? remaining[0] ?? null
          : state.currentDataset;
      return {
        datasets: remaining,
        currentDataset: nextCurrent,
        selectedSection: nextCurrent ? null : state.selectedSection,
      };
    }),

  addSectionLocal: (section) =>
    set((state) => {
      if (!state.currentDataset) return state;
      return {
        currentDataset: {
          ...state.currentDataset,
          sections: [...state.currentDataset.sections, section],
        },
      };
    }),

  updateSectionLocal: (sectionId, updates) =>
    set((state) => {
      if (!state.currentDataset) return state;
      return {
        currentDataset: {
          ...state.currentDataset,
          sections: state.currentDataset.sections.map((s) =>
            s.id === sectionId ? { ...s, ...updates } : s
          ),
        },
      };
    }),

  deleteSectionLocal: (sectionId) =>
    set((state) => {
      if (!state.currentDataset) return state;
      const sections = state.currentDataset.sections.filter((s) => s.id !== sectionId);
      return {
        currentDataset: {
          ...state.currentDataset,
          sections,
        },
        selectedSection:
          state.selectedSection && state.selectedSection.id === sectionId
            ? sections[0] ?? null
            : state.selectedSection,
      };
    }),

  reorderSectionsLocal: (orderedIds) =>
    set((state) => {
      if (!state.currentDataset) return state;
      const byId = new Map(state.currentDataset.sections.map((s) => [s.id, s]));
      const reordered: DatasetSection[] = [];
      orderedIds.forEach((id, index) => {
        const section = byId.get(id);
        if (section) {
          reordered.push({
            ...section,
            order: index + 1,
          });
        }
      });
      return {
        currentDataset: {
          ...state.currentDataset,
          sections: reordered,
        },
      };
    }),
}));


