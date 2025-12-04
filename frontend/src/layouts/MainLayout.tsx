import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../features/auth/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  Settings,
  LogOut,
  Search,
  Bell,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Navigation groups
const navGroups = [
  {
    label: 'Platform',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: Home },
      { name: 'Tasks', path: '/tasks', icon: FileText },
      { name: 'Flows', path: '/flows', icon: Workflow },
      { name: 'Triggers', path: '/triggers', icon: Zap },
    ],
  },
  {
    label: 'Data',
    items: [
      { name: 'Database', path: '/database', icon: Database },
      { name: 'Datasets', path: '/datasets', icon: BarChart3 },
    ],
  },
  {
    label: 'Administration',
    items: [
      { name: 'Company', path: '/company', icon: Building2 },
      { name: 'Integrations', path: '/integrations', icon: Plug },
      { name: 'Audit Logs', path: '/audit-logs', icon: ScrollText },
      { name: 'Users', path: '/users', icon: Users },
    ],
  },
];

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isExpanded, setIsExpanded] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  const toggleSidebar = () => setIsExpanded(!isExpanded);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <aside
          className={cn(
            "flex flex-col bg-card border-r border-border transition-all duration-300",
            isExpanded ? "w-64" : "w-16"
          )}
        >
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-border px-4">
            <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xl shadow-sm">
                🏗️
              </div>
              {isExpanded && (
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-sm font-semibold">ERP Builder</span>
                  <span className="truncate text-xs text-muted-foreground">Workflow Platform</span>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-3">
            {navGroups.map((group) => (
              <div key={group.label} className="mb-6">
                {isExpanded && (
                  <div className="px-4 py-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </span>
                  </div>
                )}
                <div className="space-y-1 px-3">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    const button = (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                          active
                            ? "bg-primary/10 text-primary shadow-sm"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                          !isExpanded && "justify-center px-2"
                        )}
                      >
                        <Icon className="size-5 shrink-0" />
                        {isExpanded && <span className="truncate">{item.name}</span>}
                      </Link>
                    );

                    if (!isExpanded) {
                      return (
                        <Tooltip key={item.path}>
                          <TooltipTrigger asChild>{button}</TooltipTrigger>
                          <TooltipContent side="right" className="font-medium">
                            {item.name}
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return button;
                  })}
                </div>
              </div>
            ))}
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-border p-3 space-y-1">
            {/* Settings */}
            {isExpanded ? (
              <Link
                to="/settings"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <Settings className="size-5" />
                <span>Settings</span>
              </Link>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/settings"
                    className="flex items-center justify-center rounded-lg px-2 py-2.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <Settings className="size-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Settings</TooltipContent>
              </Tooltip>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-accent transition-colors",
                    !isExpanded && "justify-center px-2"
                  )}
                >
                  <Avatar className="h-9 w-9 shrink-0 ring-2 ring-border/50">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                      {getInitials(user?.firstName, user?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  {isExpanded && (
                    <div className="flex-1 overflow-hidden">
                      <div className="truncate text-sm font-medium">
                        {user?.firstName} {user?.lastName}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{user?.role}</div>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isExpanded ? "end" : "start"} side="top" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-6">
            {/* Toggle Button */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleSidebar}
              className="text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? (
                <PanelLeftClose className="size-5" />
              ) : (
                <PanelLeft className="size-5" />
              )}
            </Button>

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full pl-10 bg-muted/50 border-border/50"
              />
            </div>

            <div className="flex-1" />

            {/* Notifications */}
            <Button variant="ghost" size="icon-sm" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="size-5" />
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center font-semibold"
              >
                3
              </Badge>
            </Button>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-8 bg-background">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
