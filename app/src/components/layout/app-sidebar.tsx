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
  Calendar,
  Wallet,
  Shield,
  Calculator,
  Check,
  FileText,
  FolderOpen,
} from "lucide-react";
import type { SessionUser } from "@/types";
import { CommandSearch } from "./command-search";
import { ThemeToggleCompact } from "@/components/ui/theme-toggle";

interface AppSidebarProps {
  user: SessionUser;
}

// Role display names
const getRoleDisplayName = (role: string) => {
  switch (role) {
    case "OWNER": return "เจ้าของ";
    case "ADMIN": return "ผู้ดูแล";
    case "ACCOUNTING": return "บัญชี";
    case "STAFF": return "พนักงาน";
    default: return "สมาชิก";
  }
};

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "OWNER": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
    case "ADMIN": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case "ACCOUNTING": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
};

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Role checks
  const currentRole = user.currentOrganization?.role || "STAFF";
  const isOwner = currentRole === "OWNER";
  const isAdmin = currentRole === "ADMIN" || isOwner;
  const isAccounting = currentRole === "ACCOUNTING" || isAdmin;
  const isFirmMember = !!user.firmMembership;

  // Navigation items based on role
  const mainNavItems = [
    { title: "เอกสาร", href: "/documents", icon: FileText },
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  // Accounting items (ACCOUNTING, ADMIN, OWNER)
  const accountingNavItems = [
    { title: "ติดตาม WHT", href: "/wht-tracking", icon: Receipt },
    { title: "รอคืนเงิน", href: "/reimbursement", icon: Wallet },
    { title: "Export", href: "/export", icon: Download },
    { title: "รายงาน", href: "/reports", icon: BarChart3 },
  ];

  // Settings items (ADMIN, OWNER only)
  const settingsNavItems = [
    { title: "องค์กร", href: "/settings", icon: Building2, ownerOnly: false },
    { title: "สมาชิก", href: "/settings/members", icon: Users, ownerOnly: false },
    { title: "สำนักบัญชี", href: "/settings/accounting-firm", icon: Calculator, ownerOnly: false },
    { title: "ผู้ติดต่อ", href: "/settings/contacts", icon: UserRound, ownerOnly: false },
    { title: "หมวดหมู่", href: "/settings/categories", icon: Tags, ownerOnly: false },
    { title: "งวดบัญชี", href: "/settings/fiscal-periods", icon: Calendar, ownerOnly: false },
    { title: "Export Profiles", href: "/settings/export-profiles", icon: Download, ownerOnly: false },
    { title: "การเชื่อมต่อ", href: "/settings/integrations", icon: Settings, ownerOnly: true },
    { title: "Audit Log", href: "/settings/audit-log", icon: Shield, ownerOnly: true },
  ];

  // Filter settings based on role
  const filteredSettings = settingsNavItems.filter(item => {
    if (item.ownerOnly && !isOwner) return false;
    return true;
  });

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r border-border bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-14 items-center gap-3 px-4 border-b border-sidebar-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Package className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sidebar-foreground">กล่องเอกสาร</span>
        </div>

        {/* Organization Selector */}
        {user.currentOrganization && (
          <div className="px-3 py-3 border-b border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors text-left">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar border border-sidebar-border text-sidebar-foreground">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-sidebar-foreground">
                      {user.currentOrganization.name}
                    </p>
                    <Badge variant="secondary" className={cn("text-[10px] mt-0.5", getRoleBadgeColor(currentRole))}>
                      {getRoleDisplayName(currentRole)}
                    </Badge>
                  </div>
                  <ChevronsUpDown className="h-4 w-4 text-sidebar-foreground/50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="start">
                {/* Organizations Section */}
                {user.organizations.length > 0 && (
                  <>
                    <DropdownMenuLabel>ธุรกิจของฉัน</DropdownMenuLabel>
                    {user.organizations.map((org) => (
                      <DropdownMenuItem key={org.id} asChild>
                        <Link href={`/switch-org/${org.slug}`} className="cursor-pointer">
                          <Building2 className="mr-2 h-4 w-4" />
                          <span className="truncate flex-1">{org.name}</span>
                          {org.id === user.currentOrganization?.id && (
                            <Check className="ml-2 h-4 w-4 text-primary" />
                          )}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}

                {/* Firm Section */}
                {user.firmMembership && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>สำนักงานบัญชี</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href="/firm/dashboard" className="cursor-pointer">
                        <Calculator className="mr-2 h-4 w-4" />
                        <span className="truncate">{user.firmMembership.firmName}</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/onboarding" className="cursor-pointer">
                    <Plus className="mr-2 h-4 w-4" />
                    สร้างธุรกิจใหม่
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {/* Search */}
          <div className="mb-4">
            <CommandSearch />
          </div>
          
          {/* Create Button */}
          <Link
            href="/documents/new"
            className="flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary/90 px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors mb-4"
          >
            <Plus className="h-4 w-4" />
            สร้างกล่องใหม่
          </Link>

          {/* Main Menu - Everyone */}
          <div className="space-y-1">
            <p className="px-3 mb-2 text-[11px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
              เมนูหลัก
            </p>
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

          {/* Accounting Menu - ACCOUNTING, ADMIN, OWNER */}
          {isAccounting && (
            <div className="mt-6">
              <p className="px-3 mb-2 text-[11px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                งานบัญชี
              </p>
              <div className="space-y-1">
                {accountingNavItems.map((item) => {
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
          )}

          {/* Firm Portal Link - Only if user is a firm member */}
          {isFirmMember && (
            <div className="mt-6">
              <p className="px-3 mb-2 text-[11px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                สำนักงานบัญชี
              </p>
              <div className="space-y-1">
                <Link
                  href="/firm/dashboard"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    pathname.startsWith("/firm")
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <Calculator className="h-4 w-4" />
                  เข้าสู่ Firm Portal
                </Link>
              </div>
            </div>
          )}

          {/* Settings Menu - ADMIN, OWNER */}
          {isAdmin && (
            <div className="mt-6">
              <p className="px-3 mb-2 text-[11px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                ตั้งค่า
              </p>
              <div className="space-y-1">
                {filteredSettings.map((item) => {
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
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    ตั้งค่าองค์กร
                  </Link>
                </DropdownMenuItem>
              )}
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
