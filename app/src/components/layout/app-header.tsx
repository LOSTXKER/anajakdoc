"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface AppHeaderProps {
  title: string;
  description?: string;
  showCreateButton?: boolean;
  action?: React.ReactNode;
}

export function AppHeader({ title, description, showCreateButton = true, action }: AppHeaderProps) {
  return (
    <header className="border-b bg-white">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="text-sm text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <NotificationBell />
            
            {action}
            
            {showCreateButton && !action && (
              <Button asChild>
                <Link href="/documents/new">
                  <Plus className="mr-1.5 h-4 w-4" />
                  สร้างกล่องใหม่
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
