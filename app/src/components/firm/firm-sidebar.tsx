"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Package,
  LayoutDashboard,
  Users,
  Building2,
  LogOut,
  ChevronDown,
  Settings,
  Calendar,
  Briefcase,
} from "lucide-react";
import type { SessionUser } from "@/types";
import { CommandSearch } from "@/components/layout/command-search";
import { ThemeToggleCompact } from "@/components/ui/theme-toggle";

interface FirmSidebarProps {
  user: SessionUser;
}

const firmNavItems = [
  { title: "Dashboard", href: "/firm/dashboard", icon: LayoutDashboard },
  { title: "Clients", href: "/firm/clients", icon: Briefcase },
];

const manageNavItems = [
  { title: "ทีมงาน", href: "/firm/team", icon: Users },
  { title: "ปฏิทิน", href: "/firm/calendar", icon: Calendar },
];

const settingsNavItems = [
  { title: "ตั้งค่าสำนักงาน", href: "/firm/settings", icon: Settings },
];

export function FirmSidebar({ user }: FirmSidebarProps) {
  const pathname = usePathname();

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const firmName = user.firmMembership?.firmName || "สำนักงานบัญชี";
  const firmRole = user.firmMembership?.role || "STAFF";

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "OWNER": return "เจ้าของ";
      case "ADMIN": return "ผู้ดูแล";
      case "ACCOUNTANT": return "นักบัญชี";
      default: return "พนักงาน";
    }
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r border-border bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-5 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg text-sidebar-foreground">Firm Portal</span>
        </div>

        {/* Firm Info */}
        <div className="px-3 py-3 border-b border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent/50">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar border border-sidebar-border text-sidebar-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-sidebar-foreground">
                {firmName}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {getRoleLabel(firmRole)}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {/* Search */}
          <div className="mb-4">
            <CommandSearch />
          </div>
          
          {/* Overview */}
          <div className="space-y-1">
            <p className="px-3 mb-2 text-[11px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
              ภาพรวม
            </p>
            {firmNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive && "text-sidebar-primary")} />
                  {item.title}
                </Link>
              );
            })}
          </div>

          {/* Manage */}
          <div className="mt-6">
            <p className="px-3 mb-2 text-[11px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
              จัดการ
            </p>
            <div className="space-y-1">
              {manageNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", isActive && "text-sidebar-primary")} />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Settings */}
          <div className="mt-6">
            <p className="px-3 mb-2 text-[11px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
              ตั้งค่า
            </p>
            <div className="space-y-1">
              {settingsNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", isActive && "text-sidebar-primary")} />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Theme Toggle & User Menu */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          {/* Theme Toggle */}
          <ThemeToggleCompact />
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.avatarUrl || undefined} />
                  <AvatarFallback className="bg-sidebar-primary/10 text-sidebar-primary text-sm">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-sidebar-foreground">
                    {user.name || "ผู้ใช้"}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-sidebar-foreground/50 flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" side="top">
              <DropdownMenuLabel>บัญชีของฉัน</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <Users className="mr-2 h-4 w-4" />
                  โปรไฟล์
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action="/api/auth/signout" method="POST" className="w-full">
                  <button type="submit" className="flex w-full items-center text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    ออกจากระบบ
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
}
