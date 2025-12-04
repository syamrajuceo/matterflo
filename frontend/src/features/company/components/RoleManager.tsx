import { useEffect, useState, useMemo } from 'react';
import { useCompanyStore } from '../store/companyStore';
import { companyService, type Role } from '../services/company.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Edit, Trash2, Plus, Check } from 'lucide-react';

export const RoleManager = () => {
  const { roles, setRoles, isLoading, setIsLoading, selectedDepartmentId, tree, search } = useCompanyStore();
  const { showToast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [roleDepartmentId, setRoleDepartmentId] = useState<string>('');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    view: false,
    edit: false,
    delete: false,
    approve: false,
    manage: false,
  });

  useEffect(() => {
    const loadRoles = async () => {
      try {
        setIsLoading(true);
        const fetchedRoles = await companyService.listRoles();
        setRoles(fetchedRoles);
      } catch (error) {
        console.error('Failed to load roles', error);
        showToast({
          title: 'Failed to load roles',
          description: 'Please try again after reloading the page.',
          status: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    void loadRoles();
  }, [setIsLoading, setRoles, showToast]);

  const getAllDepartmentIds = (nodes: typeof tree): Array<{ id: string; name: string }> => {
    const result: Array<{ id: string; name: string }> = [];
    const traverse = (node: (typeof tree)[0], depth = 0) => {
      result.push({ id: node.id, name: '  '.repeat(depth) + node.name });
      node.children.forEach((child) => traverse(child, depth + 1));
    };
    nodes.forEach((node) => traverse(node));
    return result;
  };

  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      if (search && !role.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (selectedDepartmentId && role.departmentId !== selectedDepartmentId) {
        return false;
      }
      return true;
    });
  }, [roles, search, selectedDepartmentId]);

  const handleOpenCreate = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
    setRoleDepartmentId(selectedDepartmentId || '__none__');
    setPermissions({
      view: false,
      edit: false,
      delete: false,
      approve: false,
      manage: false,
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || '');
    setRoleDepartmentId(role.departmentId || '__none__');
    setPermissions(role.permissions);
    setIsCreateOpen(true);
  };

  const handleSaveRole = async () => {
    if (!roleName.trim()) return;
    try {
      setIsLoading(true);
      // For create: omit departmentId if '__none__' or empty
      // For update: pass '__none__' so service can clear it
      const departmentId = 
        roleDepartmentId === '__none__' || roleDepartmentId === '' 
          ? (editingRole ? '__none__' : undefined)
          : (roleDepartmentId || undefined);
      
      if (editingRole) {
        await companyService.updateRole(editingRole.id, {
          name: roleName.trim(),
          description: roleDescription.trim() || undefined,
          departmentId,
          permissions,
        });
        showToast({
          title: 'Role updated',
          description: 'The role has been updated successfully.',
          status: 'success',
        });
      } else {
        await companyService.createRole({
          name: roleName.trim(),
          description: roleDescription.trim() || undefined,
          departmentId,
          permissions,
        });
        showToast({
          title: 'Role created',
          description: 'The new role has been created successfully.',
          status: 'success',
        });
      }
      
      // Reload roles list to get updated data
      const updatedRoles = await companyService.listRoles();
      setRoles(updatedRoles);
      
      // Reset form and close dialog
      setEditingRole(null);
      setRoleName('');
      setRoleDescription('');
      setRoleDepartmentId(selectedDepartmentId || '__none__');
      setPermissions({
        view: false,
        edit: false,
        delete: false,
        approve: false,
        manage: false,
      });
      setIsCreateOpen(false);
    } catch (error) {
      console.error('Failed to save role', error);
      showToast({
        title: editingRole ? 'Failed to update role' : 'Failed to create role',
        description: 'Please try again after reloading the page.',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = async (id: string, name: string) => {
    if (!window.confirm(`Delete role "${name}"? This cannot be undone.`)) return;
    try {
      setIsLoading(true);
      await companyService.deleteRole(id);
      const updatedRoles = await companyService.listRoles();
      setRoles(updatedRoles);
      showToast({
        title: 'Role deleted',
        description: `"${name}" has been removed.`,
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to delete role', error);
      showToast({
        title: 'Failed to delete role',
        description: 'Please try again.',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePermission = (key: string) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getDepartmentName = (departmentId: string | null | undefined): string => {
    if (!departmentId || departmentId === '__none__') return 'Company-wide';
    const findDept = (nodes: typeof tree, id: string): typeof tree[0] | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        const found = findDept(node.children, id);
        if (found) return found;
      }
      return null;
    };
    const dept = findDept(tree, departmentId);
    return dept?.name || 'Unknown';
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="text-xs font-medium text-muted-foreground">Roles</div>
        <Button size="sm" variant="outline" onClick={handleOpenCreate}>
          <Plus className="mr-1 h-3 w-3" />
          New Role
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {filteredRoles.length === 0 ? (
            <div className="px-2 py-4 text-xs text-muted-foreground">
              {search || selectedDepartmentId
                ? 'No roles found matching your filters.'
                : 'No roles yet. Create one to get started.'}
            </div>
          ) : (
            filteredRoles.map((role) => (
              <Card key={role.id} className="border px-3 py-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{role.name}</span>
                      <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                        {getDepartmentName(role.departmentId)}
                      </Badge>
                      {role.employeeCount !== undefined && role.employeeCount > 0 && (
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                          {role.employeeCount} {role.employeeCount === 1 ? 'employee' : 'employees'}
                        </Badge>
                      )}
                    </div>
                    {role.description && (
                      <p className="text-[11px] text-muted-foreground">{role.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {Object.entries(role.permissions)
                        .filter(([, value]) => value)
                        .map(([key]) => (
                          <Badge
                            key={key}
                            variant="outline"
                            className="px-1.5 py-0 text-[10px] capitalize"
                          >
                            {key}
                          </Badge>
                        ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => handleOpenEdit(role)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteRole(role.id, role.name)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {editingRole ? 'Edit Role' : 'New Role'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingRole
                ? 'Update the role details and permissions below.'
                : 'Create a new role with specific permissions for your organization.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[11px]">Name</Label>
              <Input
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="Manager"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Description</Label>
              <Input
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Department</Label>
              <Select value={roleDepartmentId} onValueChange={setRoleDepartmentId}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select department (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Company-wide</SelectItem>
                  {getAllDepartmentIds(tree).map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px]">Permissions</Label>
              <div className="space-y-1.5 rounded-md border p-2">
                {Object.keys(permissions).map((key) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-2 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={permissions[key]}
                      onChange={() => togglePermission(key)}
                      className="h-3.5 w-3.5 rounded border-border"
                    />
                    <span className="capitalize">{key}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                size="sm" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSaveRole();
                }} 
                disabled={!roleName.trim() || isLoading}
              >
                {isLoading ? 'Saving...' : editingRole ? 'Save Changes' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

