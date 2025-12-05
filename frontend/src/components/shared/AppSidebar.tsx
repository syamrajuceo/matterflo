"use client"

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useRole } from '@/hooks/useRole';
import { CompanySwitcher } from './CompanySwitcher';
import {
  Home,
  FileText,
  Workflow,
  Zap,
  Database,
  BarChart3,
  Building2,
  Plug,
  ScrollText,
  Users,
  Mail,
  ChevronRight,
  ChevronsUpDown,
  Settings,
  LogOut,
  Palette,
  SquareTerminal,
  Bot,
  BookOpen,
  Frame,
  PieChart,
  Map,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Navigation data structure matching Figma design
interface NavSubItem {
  title: string;
  path: string;
}

interface NavItem {
  title: string;
  path: string;
  icon: LucideIcon;
  isActive?: boolean;
  items?: NavSubItem[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navigationData: NavGroup[] = [
  {
    label: 'Platform',
    items: [
      {
        title: 'Dashboard',
        path: '/dashboard',
        icon: Home,
        items: [
          { title: 'Overview', path: '/dashboard' },
          { title: 'Analytics', path: '/dashboard/analytics' },
          { title: 'Reports', path: '/dashboard/reports' },
        ],
      },
      {
        title: 'Tasks',
        path: '/tasks',
        icon: FileText,
        items: [
          { title: 'All Tasks', path: '/tasks' },
          { title: 'Task Builder', path: '/tasks/new' },
        ],
      },
      {
        title: 'Flows',
        path: '/flows',
        icon: Workflow,
      },
      {
        title: 'Triggers',
        path: '/triggers',
        icon: Zap,
      },
    ],
  },
  {
    label: 'Data',
    items: [
      { title: 'Database', path: '/database', icon: Database },
      { title: 'Datasets', path: '/datasets', icon: BarChart3 },
    ],
  },
  {
    label: 'Administration',
    items: [
      { title: 'Company', path: '/company', icon: Building2 },
      { title: 'Company Settings', path: '/company/settings', icon: Palette },
      { title: 'Integrations', path: '/integrations', icon: Plug },
      { title: 'Email Templates', path: '/email-templates', icon: Mail },
      { title: 'Audit Logs', path: '/audit-logs', icon: ScrollText },
      { title: 'Users', path: '/users', icon: Users },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const {
    isDeveloper,
    isAdmin,
    canCreateTasks,
    canCreateFlows,
    canCreateDatasets,
    canCreateTriggers,
    canEditDatabaseSchema,
    canManageIntegrations,
    canManageEmployees,
  } = useRole();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/');
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Get company name
  const companyName = user?.firstName ? `${user.firstName}'s Company` : 'ERP Builder';
  const companySubtitle = 'Enterprise';

  // Debug: Log role and permissions in development
  if (import.meta.env.DEV) {
    console.log('[Sidebar Debug]', {
      userRole: user?.role,
      isDeveloper,
      isAdmin,
      canCreateTriggers,
      canCreateDatasets,
      canManageIntegrations,
      canManageEmployees,
    });
  }

  // Filter navigation items based on role
  const filteredNavigationData = navigationData.map((group) => {
    const filteredItems = group.items.filter((item) => {
      // Dashboard - everyone can access
      if (item.path === '/dashboard') return true;
      
      // Tasks - everyone can view, only developers/admins can create
      if (item.path === '/tasks') {
        // Filter sub-items: hide "Task Builder" for non-developers/admins
        if (item.items) {
          item.items = item.items.filter((subItem) => {
            if (subItem.path === '/tasks/new') return canCreateTasks;
            return true;
          });
        }
        return true; // Everyone can view tasks
      }
      
      // Flows - everyone can view
      if (item.path === '/flows') return true;
      
      // Triggers - developers and admins
      if (item.path === '/triggers') return canCreateTriggers;
      
      // Database - everyone can view
      if (item.path === '/database') return true;
      
      // Datasets - developers and admins
      if (item.path === '/datasets') return canCreateDatasets;
      
      // Company - everyone can access
      if (item.path === '/company') return true;
      
      // Company Settings - everyone can access
      if (item.path === '/company/settings') return true;
      
      // Integrations - developers and admins
      if (item.path === '/integrations') return canManageIntegrations;
      
      // Email Templates - developers and admins
      if (item.path === '/email-templates') return isDeveloper || isAdmin;
      
      // Audit Logs - everyone can view
      if (item.path === '/audit-logs') return true;
      
      // Users - admins/managers/developers
      if (item.path === '/users') return canManageEmployees;
      
      // Default: show item
      return true;
    });
    
    return {
      ...group,
      items: filteredItems,
    };
  });

  return (
    <Sidebar 
      collapsible="none"
      className="border-r border-sidebar-border"
    >
      {/* Header with Company Switcher */}
      <SidebarHeader className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 w-full">
              {/* Company Icon */}
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
                <Building2 className="size-4" />
              </div>
              {/* Company Switcher */}
              <div className="flex-1 min-w-0">
                <CompanySwitcher />
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation Content */}
      <SidebarContent>
        {filteredNavigationData.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wide">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const hasSubItems = item.items && item.items.length > 0;
                  const itemIsActive = isActive(item.path);

                  if (hasSubItems) {
                    return (
                      <Collapsible
                        key={item.path}
                        asChild
                        defaultOpen={itemIsActive}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              tooltip={item.title}
                              isActive={itemIsActive}
                              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            >
                              <item.icon className="size-4" />
                              <span className="flex-1">{item.title}</span>
                              <ChevronRight className="size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.items?.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.path}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={location.pathname === subItem.path}
                                  >
                                    <Link to={subItem.path}>
                                      <span>{subItem.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={itemIsActive}
                        className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      >
                        <Link to={item.path}>
                          <item.icon className="size-4" />
                          <span className="flex-1">{item.title}</span>
                          <ChevronRight className="size-4 opacity-50" />
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer with User Menu */}
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  {/* User Avatar */}
                  <Avatar className="size-8 rounded-lg">
                    <AvatarImage src="" alt={user?.firstName || 'User'} />
                    <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs font-medium">
                      {getInitials(user?.firstName, user?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  {/* User Info */}
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-sidebar-foreground">
                      {user?.firstName || user?.lastName || 'User'}
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/70">
                      {user?.email || 'user@example.com'}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="size-8 rounded-lg">
                      <AvatarImage src="" alt={user?.firstName || 'User'} />
                      <AvatarFallback className="rounded-lg">
                        {getInitials(user?.firstName, user?.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user?.firstName || user?.lastName || 'User'}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user?.email || 'user@example.com'}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 size-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
