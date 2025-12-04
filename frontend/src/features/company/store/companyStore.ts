import { create } from 'zustand';
import type { DepartmentTreeNode, Role } from '../services/company.service';

type CompanyTab = 'departments' | 'roles' | 'users';

interface CompanyState {
  tree: DepartmentTreeNode[];
  selectedDepartmentId: string | null;
  roles: Role[];
  selectedRoleId: string | null;
  activeTab: CompanyTab;
  isLoading: boolean;
  search: string;

  setTree: (tree: DepartmentTreeNode[]) => void;
  setSelectedDepartmentId: (id: string | null) => void;
  setRoles: (roles: Role[]) => void;
  setSelectedRoleId: (id: string | null) => void;
  setActiveTab: (tab: CompanyTab) => void;
  setIsLoading: (loading: boolean) => void;
  setSearch: (value: string) => void;
}

export const useCompanyStore = create<CompanyState>((set) => ({
  tree: [],
  selectedDepartmentId: null,
  roles: [],
  selectedRoleId: null,
  activeTab: 'departments',
  isLoading: false,
  search: '',

  setTree: (tree) => set({ tree }),
  setSelectedDepartmentId: (id) => set({ selectedDepartmentId: id }),
  setRoles: (roles) => set({ roles }),
  setSelectedRoleId: (id) => set({ selectedRoleId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setSearch: (value) => set({ search: value }),
}));


