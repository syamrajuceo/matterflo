import { useAuthStore } from '../features/auth/store/authStore';

export type UserRole = 'DEVELOPER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

/**
 * Hook to check user roles and permissions
 */
export function useRole() {
  const user = useAuthStore((state) => state.user);
  const role = (user?.role || 'EMPLOYEE') as UserRole;

  const isDeveloper = role === 'DEVELOPER';
  const isAdmin = role === 'ADMIN';
  const isManager = role === 'MANAGER';
  const isEmployee = role === 'EMPLOYEE';
  
  // Clients are non-developers
  const isClient = !isDeveloper;
  
  // Can manage employees (ADMIN, MANAGER, DEVELOPER)
  const canManageEmployees = isDeveloper || isAdmin || isManager;
  
  // Can edit flows (limited - clients can add levels, change assignments)
  const canEditFlow = isDeveloper || isAdmin || isManager;
  
  // Can create/modify structural elements (DEVELOPER and ADMIN)
  // ADMIN users have full access to create/modify tasks, flows, datasets, triggers, etc.
  const canCreateTasks = isDeveloper || isAdmin;
  const canCreateFlows = isDeveloper || isAdmin;
  const canCreateDatasets = isDeveloper || isAdmin;
  const canCreateTriggers = isDeveloper || isAdmin;
  const canEditDatabaseSchema = isDeveloper || isAdmin;
  const canManageIntegrations = isDeveloper || isAdmin;

  return {
    role,
    isDeveloper,
    isAdmin,
    isManager,
    isEmployee,
    isClient,
    canManageEmployees,
    canEditFlow,
    canCreateTasks,
    canCreateFlows,
    canCreateDatasets,
    canCreateTriggers,
    canEditDatabaseSchema,
    canManageIntegrations,
  };
}

