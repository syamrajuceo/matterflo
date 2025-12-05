"use client"

import { Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Bell } from 'lucide-react';
import { AppSidebar } from '@/components/shared/AppSidebar';
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';

export default function MainLayout() {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border bg-white px-4">
          {/* Sidebar Toggle */}
          <SidebarTrigger className="-ml-1" />

          {/* Search */}
          <div className="relative flex-1 max-w-md ml-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full pl-10 bg-sidebar border-sidebar-border text-sidebar-foreground h-9"
            />
          </div>

          <div className="flex-1" />

          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
          >
            <Bell className="size-5" />
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 size-5 rounded-full p-0 text-[10px] flex items-center justify-center font-semibold"
            >
              3
            </Badge>
          </Button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-sidebar">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
