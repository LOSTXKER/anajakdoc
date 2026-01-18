"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  FileText,
  Inbox,
  FolderOpen,
  Settings,
  Users,
  UserRound,
  Building2,
  LogOut,
  ChevronDown,
  Plus,
  Search,
  Tags,
  Briefcase,
  Download,
  BarChart3,
  Receipt,
} from "lucide-react";
import type { SessionUser } from "@/types";

interface AppSidebarProps {
  user: SessionUser;
}

const mainNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "เอกสารของฉัน",
    href: "/documents",
    icon: FileText,
  },
  {
    title: "Inbox",
    href: "/inbox",
    icon: Inbox,
    roles: ["ACCOUNTING", "ADMIN", "OWNER"],
  },
  {
    title: "ติดตาม WHT",
    href: "/wht-tracking",
    icon: Receipt,
    roles: ["ACCOUNTING", "ADMIN", "OWNER"],
  },
  {
    title: "รายงาน",
    href: "/reports",
    icon: BarChart3,
    roles: ["ACCOUNTING", "ADMIN", "OWNER"],
  },
  {
    title: "Export ข้อมูล",
    href: "/export",
    icon: Download,
    roles: ["ACCOUNTING", "ADMIN", "OWNER"],
  },
  {
    title: "กลุ่มค่าใช้จ่าย",
    href: "/expense-groups",
    icon: FolderOpen,
  },
];

const settingsNavItems = [
  {
    title: "ตั้งค่าองค์กร",
    href: "/settings",
    icon: Building2,
  },
  {
    title: "สมาชิก",
    href: "/settings/members",
    icon: Users,
  },
  {
    title: "ผู้ติดต่อ",
    href: "/settings/contacts",
    icon: UserRound,
  },
  {
    title: "หมวดหมู่",
    href: "/settings/categories",
    icon: Tags,
  },
  {
    title: "ศูนย์ต้นทุน",
    href: "/settings/cost-centers",
    icon: Briefcase,
  },
];

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Package className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">กล่องเอกสาร</span>
            <span className="text-xs text-muted-foreground">Document Hub</span>
          </div>
        </div>

        {/* Organization Switcher */}
        {user.currentOrganization && (
          <div className="border-b p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between h-auto py-2 px-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium truncate max-w-[140px]">
                        {user.currentOrganization.name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {user.currentOrganization.role.toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel>องค์กรของคุณ</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.organizations.map((org) => (
                  <DropdownMenuItem key={org.id} asChild>
                    <Link href={`/switch-org/${org.slug}`} className="cursor-pointer">
                      <Building2 className="mr-2 h-4 w-4" />
                      <span className="truncate">{org.name}</span>
                      {org.id === user.currentOrganization?.id && (
                        <span className="ml-auto text-xs text-primary">✓</span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/onboarding" className="cursor-pointer">
                    <Plus className="mr-2 h-4 w-4" />
                    สร้างองค์กรใหม่
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Search */}
        <div className="p-3">
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground h-9"
            asChild
          >
            <Link href="/search">
              <Search className="mr-2 h-4 w-4" />
              ค้นหาเอกสาร...
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </Link>
          </Button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto scrollbar-thin">
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              // Check role-based visibility
              if (item.roles && user.currentOrganization) {
                if (!item.roles.includes(user.currentOrganization.role)) {
                  return null;
                }
              }

              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                  {(item as { badge?: string }).badge && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                      {(item as { badge?: string }).badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Settings Section */}
          {user.currentOrganization && 
           ["ADMIN", "OWNER"].includes(user.currentOrganization.role) && (
            <div className="pt-4">
              <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
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
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* User Menu */}
        <div className="border-t p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start h-auto py-2 px-2"
              >
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={user.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name || "ผู้ใช้"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </Button>
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
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  ตั้งค่า
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action="/api/auth/signout" method="POST" className="w-full">
                  <button type="submit" className="flex w-full items-center text-destructive">
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
