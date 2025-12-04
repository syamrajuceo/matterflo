import { useEffect, useState } from 'react';
import { useCompanyStore } from '../store/companyStore';
import { companyService, type User, type Role } from '../services/company.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { User as UserIcon } from 'lucide-react';

export const UserAssignment = () => {
  const { roles, setIsLoading, search } = useCompanyStore();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true);
        const fetchedUsers = await companyService.getUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Failed to load users', error);
        showToast({
          title: 'Failed to load users',
          description: 'Please try again after reloading the page.',
          status: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    void loadUsers();
  }, [setIsLoading, showToast]);

  const filteredUsers = users.filter((user) => {
    if (search) {
      const searchLower = search.toLowerCase();
      const name = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      return (
        name.includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.role.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const handleAssignRole = async (userId: string) => {
    if (!selectedRoleId) {
      showToast({
        title: 'No role selected',
        description: 'Please select a role to assign.',
        status: 'error',
      });
      return;
    }

    try {
      setIsLoading(true);
      await companyService.assignUserToRole(userId, selectedRoleId);
      const updatedUsers = await companyService.getUsers();
      setUsers(updatedUsers);
      setAssigningUserId(null);
      setSelectedRoleId('');
      showToast({
        title: 'User assigned',
        description: 'The user has been assigned to the role successfully.',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to assign user to role', error);
      showToast({
        title: 'Failed to assign user',
        description: 'Please try again after reloading the page.',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getUserDisplayName = (user: User): string => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-2">
        <div className="text-xs font-medium text-muted-foreground">User Assignment</div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {filteredUsers.length === 0 ? (
            <div className="px-2 py-4 text-xs text-muted-foreground">
              {search ? 'No users found matching your search.' : 'No users found.'}
            </div>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id} className="border px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <UserIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">
                          {getUserDisplayName(user)}
                        </span>
                        {!user.isActive && (
                          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{user.email}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="px-1.5 py-0 text-[10px] capitalize">
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {assigningUserId === user.id ? (
                      <div className="flex items-center gap-2">
                        <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                          <SelectTrigger className="h-8 w-40">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleAssignRole(user.id)}
                          disabled={!selectedRoleId}
                        >
                          Assign
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAssigningUserId(null);
                            setSelectedRoleId('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setAssigningUserId(user.id)}
                      >
                        Assign Role
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

