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
  UserRound,
  Building2,
  LogOut,
  ChevronDown,
  Plus,
  Tags,
  Download,
  BarChart3,
  Receipt,
  Settings,
  ChevronsUpDown,
} from "lucide-react";
import type { SessionUser } from "@/types";

interface AppSidebarProps {
  user: SessionUser;
}

const mainNavItems = [
  { title: "เอกสาร", href: "/documents", icon: Package },
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

const accountingItems = [
  { title: "ติดตาม WHT", href: "/wht-tracking", icon: Receipt },
  { title: "Export", href: "/export", icon: Download },
  { title: "รายงาน", href: "/reports", icon: BarChart3 },
];

const settingsNavItems = [
  { title: "องค์กร", href: "/settings", icon: Building2 },
  { title: "สมาชิก", href: "/settings/members", icon: Users },
  { title: "ผู้ติดต่อ", href: "/settings/contacts", icon: UserRound },
  { title: "หมวดหมู่", href: "/settings/categories", icon: Tags },
];

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const isAccounting = user.currentOrganization && 
    ["ACCOUNTING", "ADMIN", "OWNER"].includes(user.currentOrganization.role);
  
  const isAdmin = user.currentOrganization && 
    ["ADMIN", "OWNER"].includes(user.currentOrganization.role);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r border-gray-200 bg-white">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-5 border-b border-gray-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Package className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold text-lg text-gray-900">กล่องเอกสาร</span>
        </div>

        {/* Organization Selector */}
        {user.currentOrganization && (
          <div className="px-3 py-3 border-b border-gray-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white border border-gray-200 text-gray-600">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-gray-900">
                      {user.currentOrganization.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.currentOrganization.role === "OWNER" ? "เจ้าของ" : 
                       user.currentOrganization.role === "ADMIN" ? "ผู้ดูแล" :
                       user.currentOrganization.role === "ACCOUNTING" ? "บัญชี" : "พนักงาน"}
                    </p>
                  </div>
                  <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel>เปลี่ยนองค์กร</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.organizations.map((org) => (
                  <DropdownMenuItem key={org.id} asChild>
                    <Link href={`/switch-org/${org.slug}`} className="cursor-pointer">
                      <Building2 className="mr-2 h-4 w-4" />
                      <span className="truncate">{org.name}</span>
                      {org.id === user.currentOrganization?.id && (
                        <span className="ml-auto text-primary">✓</span>
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

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {/* Create Button */}
          <Link
            href="/documents/new"
            className="flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary/90 px-4 py-2.5 text-sm font-medium text-white transition-colors mb-6"
          >
            <Plus className="h-4 w-4" />
            สร้างกล่องใหม่
          </Link>

          {/* Main Menu */}
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
                  {item.title}
                </Link>
              );
            })}
          </div>

          {/* Accounting Menu */}
          {isAccounting && (
            <div className="mt-6">
              <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                งานบัญชี
              </p>
              <div className="space-y-1">
                {accountingItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-emerald-50 text-emerald-700 font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4", isActive && "text-emerald-600")} />
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Settings Menu */}
          {isAdmin && (
            <div className="mt-6">
              <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
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
                          ? "bg-emerald-50 text-emerald-700 font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4", isActive && "text-emerald-600")} />
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* User Menu */}
        <div className="border-t border-gray-100 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-gray-900">
                    {user.name || "ผู้ใช้"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
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
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  ตั้งค่า
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
