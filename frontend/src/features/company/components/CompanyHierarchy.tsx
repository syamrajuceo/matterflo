import { useState, useEffect } from 'react';
import { useCompanyStore } from '../store/companyStore';
import { companyService } from '../services/company.service';
import type { DepartmentTreeNode } from '../services/company.service';
import { DepartmentTree } from './DepartmentTree';
import { RoleManager } from './RoleManager';
import { UserAssignment } from './UserAssignment';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export const CompanyHierarchy = () => {
  const {
    activeTab,
    setActiveTab,
    setTree,
    setIsLoading,
    search,
    setSearch,
    selectedDepartmentId,
    tree,
    setSelectedDepartmentId,
  } = useCompanyStore();
  const { showToast } = useToast();

  const [isCreateDeptOpen, setIsCreateDeptOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDescription, setNewDeptDescription] = useState('');
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);

  useEffect(() => {
    const loadTree = async () => {
      try {
        setIsLoading(true);
        const tree = await companyService.getHierarchyTree();
        setTree(tree);
      } catch (error) {
        console.error('Failed to load company hierarchy', error);
        showToast({
          title: 'Failed to load hierarchy',
          description: 'Please try again after reloading the page.',
          status: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    void loadTree();
  }, [setIsLoading, setTree, showToast]);

  const handleOpenCreateDept = (parentId?: string | null) => {
    setNewDeptName('');
    setNewDeptDescription('');
    setCreateParentId(parentId ?? selectedDepartmentId ?? null);
    setEditingDeptId(null);
    setIsCreateDeptOpen(true);
  };

  const findDepartmentById = (nodes: DepartmentTreeNode[], id: string): DepartmentTreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      const child = findDepartmentById(node.children, id);
      if (child) return child;
    }
    return null;
  };

  const handleOpenEditDept = (id: string) => {
    const node = findDepartmentById(tree, id);
    if (!node) return;
    setEditingDeptId(id);
    setCreateParentId(node.parentId ?? null);
    setNewDeptName(node.name);
    setNewDeptDescription(node.description ?? '');
    setIsCreateDeptOpen(true);
  };

  const handleSaveDepartment = async () => {
    if (!newDeptName.trim()) return;
    try {
      setIsLoading(true);
      if (editingDeptId) {
        await companyService.updateDepartment(editingDeptId, {
          name: newDeptName.trim(),
          description: newDeptDescription.trim() || undefined,
        });
      } else {
        await companyService.createDepartment({
          name: newDeptName.trim(),
          description: newDeptDescription.trim() || undefined,
          ...(createParentId ? { parentId: createParentId } : {}),
        });
      }
      const latestTree = await companyService.getHierarchyTree();
      setTree(latestTree);
      setIsCreateDeptOpen(false);
      showToast({
        title: editingDeptId ? 'Department updated' : 'Department created',
        description: editingDeptId
          ? 'The department details have been updated.'
          : 'The new department has been added to the hierarchy.',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to save department', error);
      showToast({
        title: editingDeptId ? 'Failed to update department' : 'Failed to create department',
        description: 'Please try again after reloading the page.',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    const node = findDepartmentById(tree, id);
    const name = node?.name ?? 'this department';
    if (!window.confirm(`Delete ${name}? All nested sub-departments will also be removed.`)) {
      return;
    }
    try {
      setIsLoading(true);
      await companyService.deleteDepartment(id);
      const latestTree = await companyService.getHierarchyTree();
      setTree(latestTree);
      if (selectedDepartmentId === id) {
        setSelectedDepartmentId(null);
      }
      showToast({
        title: 'Department deleted',
        description: 'The department has been removed from the hierarchy.',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to delete department', error);
      showToast({
        title: 'Failed to delete department',
        description: 'Please try again after reloading the page.',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">Company Hierarchy</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => handleOpenCreateDept(null)}>
            + New Department
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between border-b px-4 py-2">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="h-8">
            <TabsTrigger value="departments" className="h-8 px-3 text-xs">
              Departments
            </TabsTrigger>
            <TabsTrigger value="roles" className="h-8 px-3 text-xs">
              Roles
            </TabsTrigger>
            <TabsTrigger value="users" className="h-8 px-3 text-xs">
              Users
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search departments or roles..."
          className="h-8 max-w-xs text-xs"
        />
      </div>

      <div className="flex-1">
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => {
            setActiveTab(value as any);
            // Clear department filter when switching to Roles or Users tab
            // so all roles/users are visible
            if (value === 'roles' || value === 'users') {
              setSelectedDepartmentId(null);
            }
          }}
        >
          <TabsContent value="departments" className="m-0 h-full">
            <DepartmentTree
              onAddSubDepartment={(id) => handleOpenCreateDept(id)}
              onEditDepartment={handleOpenEditDept}
              onDeleteDepartment={handleDeleteDepartment}
            />
          </TabsContent>
          <TabsContent value="roles" className="m-0 h-full">
            <RoleManager />
          </TabsContent>
          <TabsContent value="users" className="m-0 h-full">
            <UserAssignment />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isCreateDeptOpen} onOpenChange={setIsCreateDeptOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {editingDeptId ? 'Edit Department' : 'New Department'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-[11px] text-muted-foreground">
              {editingDeptId
                ? 'Update the department details below.'
                : createParentId
                ? 'This department will be created under the selected parent.'
                : 'This department will be created at the top level.'}
            </p>
            <div className="space-y-1">
              <Label className="text-[11px]">Name</Label>
              <Input
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder="Engineering"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Description</Label>
              <Input
                value={newDeptDescription}
                onChange={(e) => setNewDeptDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateDeptOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveDepartment}
                disabled={!newDeptName.trim()}
              >
                {editingDeptId ? 'Save' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};


