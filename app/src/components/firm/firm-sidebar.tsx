"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  Plus,
  ChevronsUpDown,
  Check,
  UserCircle,
  Mail,
} from "lucide-react";
import type { SessionUser } from "@/types";
import { CommandSearch } from "@/components/layout/command-search";
import { ThemeToggleCompact } from "@/components/ui/theme-toggle";
import { getFirmRoleDisplayName, getFirmRoleBadgeColor } from "@/lib/firm-permissions";
import type { FirmRole } from ".prisma/client";

interface FirmSidebarProps {
  user: SessionUser;
}

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRoles?: FirmRole[];
};

export function FirmSidebar({ user }: FirmSidebarProps) {
  const pathname = usePathname();

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const firmName = user.firmMembership?.firmName || "สำนักงานบัญชี";
  const firmRole = (user.firmMembership?.role || "ACCOUNTANT") as FirmRole;

  // Role checks
  const isOwner = firmRole === "OWNER";
  const isManager = firmRole === "OWNER" || firmRole === "ADMIN";

  // Navigation items
  const overviewItems: NavItem[] = [
    { title: "Dashboard", href: "/firm/dashboard", icon: LayoutDashboard },
    { title: "Clients", href: "/firm/clients", icon: Briefcase },
    { title: "คำเชิญ", href: "/firm/invitations", icon: Mail },
  ];

  const manageItems: NavItem[] = [
    { title: "ทีมงาน", href: "/firm/team", icon: Users },
    { title: "ปฏิทิน", href: "/firm/calendar", icon: Calendar },
  ];

  const settingsItems: NavItem[] = [
    { title: "ตั้งค่าสำนักงาน", href: "/firm/settings", icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r border-border bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-14 items-center gap-3 px-4 border-b border-sidebar-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sidebar-foreground">Firm Portal</span>
        </div>

        {/* Firm Selector / Info */}
        <div className="px-3 py-3 border-b border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors text-left">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-sidebar-foreground">
                    {firmName}
                  </p>
                  <Badge variant="secondary" className={cn("text-[10px] mt-0.5", getFirmRoleBadgeColor(firmRole))}>
                    {getFirmRoleDisplayName(firmRole)}
                  </Badge>
                </div>
                <ChevronsUpDown className="h-4 w-4 text-sidebar-foreground/50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="start">
              {/* Switch to Business */}
              {user.organizations.length > 0 && (
                <>
                  <DropdownMenuLabel>ธุรกิจของฉัน</DropdownMenuLabel>
                  {user.organizations.map((org) => (
                    <DropdownMenuItem key={org.id} asChild>
                      <Link href={`/switch-org/${org.slug}`} className="cursor-pointer">
                        <Package className="mr-2 h-4 w-4" />
                        <span className="truncate flex-1">{org.name}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}

              {/* Current Firm */}
              <DropdownMenuLabel>สำนักงานบัญชี</DropdownMenuLabel>
              <DropdownMenuItem disabled>
                <Building2 className="mr-2 h-4 w-4" />
                <span className="truncate">{firmName}</span>
                <Check className="ml-2 h-4 w-4 text-primary" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {/* Search */}
          <div className="mb-4">
            <CommandSearch />
          </div>
          
          {/* Invite Info - ธุรกิจเชิญเข้ามา */}
          <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3 mb-4 text-xs text-violet-700 dark:text-violet-300">
            <p className="font-medium mb-1">รูปแบบใหม่</p>
            <p className="text-violet-600 dark:text-violet-400">ธุรกิจจะส่งคำเชิญมาให้คุณ</p>
          </div>

          {/* Overview */}
          <div className="space-y-1">
            <p className="px-3 mb-2 text-[11px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
              ภาพรวม
            </p>
            {overviewItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/firm/dashboard" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive && "text-violet-600 dark:text-violet-400")} />
                  {item.title}
                </Link>
              );
            })}
          </div>

          {/* Manage - Owner & Manager only */}
          {isManager && (
            <div className="mt-6">
              <p className="px-3 mb-2 text-[11px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                จัดการ
              </p>
              <div className="space-y-1">
                {manageItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4", isActive && "text-violet-600 dark:text-violet-400")} />
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Settings - Owner only */}
          {isOwner && (
            <div className="mt-6">
              <p className="px-3 mb-2 text-[11px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                ตั้งค่า
              </p>
              <div className="space-y-1">
                {settingsItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4", isActive && "text-violet-600 dark:text-violet-400")} />
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Theme Toggle & User Menu */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          <ThemeToggleCompact />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.avatarUrl || undefined} />
                  <AvatarFallback className="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-sm">
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
                  <UserCircle className="mr-2 h-4 w-4" />
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
