"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface AppHeaderProps {
  title: string;
  description?: string;
  showCreateButton?: boolean;
}

export function AppHeader({ title, description, showCreateButton = true }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <NotificationBell />
        
        {showCreateButton && (
          <Button asChild>
            <Link href="/documents/new">
              <Plus className="mr-2 h-4 w-4" />
              สร้างกล่องใหม่
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
