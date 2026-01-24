"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Package,
  LayoutDashboard,
  Users,
  UserRound,
  Building2,
  LogOut,
  Plus,
  Tags,
  Download,
  BarChart3,
  Receipt,
  Menu,
  X,
  Calendar,
  Wallet,
  ChevronsUpDown,
  Check,
  Calculator,
  Settings,
  FileText,
  Shield,
} from "lucide-react";
import type { SessionUser } from "@/types";
import { ThemeToggleCompact } from "@/components/ui/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MobileNavProps {
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

export function MobileNav({ user }: MobileNavProps) {
  const [open, setOpen] = useState(false);
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

  // Navigation items
  const mainNavItems = [
    { title: "เอกสาร", href: "/documents", icon: FileText },
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  const accountingNavItems = [
    { title: "ติดตาม WHT", href: "/wht-tracking", icon: Receipt },
    { title: "รอคืนเงิน", href: "/reimbursement", icon: Wallet },
    { title: "Export", href: "/export", icon: Download },
    { title: "รายงาน", href: "/reports", icon: BarChart3 },
  ];

  const settingsNavItems = [
    { title: "องค์กร", href: "/settings", icon: Building2, ownerOnly: false },
    { title: "สมาชิก", href: "/settings/members", icon: Users, ownerOnly: false },
    { title: "ผู้ติดต่อ", href: "/settings/contacts", icon: UserRound, ownerOnly: false },
    { title: "หมวดหมู่", href: "/settings/categories", icon: Tags, ownerOnly: false },
    { title: "งวดบัญชี", href: "/settings/fiscal-periods", icon: Calendar, ownerOnly: false },
    { title: "Export Profiles", href: "/settings/export-profiles", icon: Download, ownerOnly: false },
    { title: "การเชื่อมต่อ", href: "/settings/integrations", icon: Settings, ownerOnly: true },
    { title: "Audit Log", href: "/settings/audit-log", icon: Shield, ownerOnly: true },
  ];

  const filteredSettings = settingsNavItems.filter(item => {
    if (item.ownerOnly && !isOwner) return false;
    return true;
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 bg-card border-border">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-14 items-center justify-between px-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Package className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">กล่องเอกสาร</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground hover:bg-muted">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Organization Switcher */}
          {user.currentOrganization && (
            <div className="px-3 py-3 border-b border-border">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-left">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-card border border-border text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">
                        {user.currentOrganization.name}
                      </p>
                      <Badge variant="secondary" className={cn("text-[10px] mt-0.5", getRoleBadgeColor(currentRole))}>
                        {getRoleDisplayName(currentRole)}
                      </Badge>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="start">
                  {user.organizations.length > 0 && (
                    <>
                      <DropdownMenuLabel>ธุรกิจของฉัน</DropdownMenuLabel>
                      {user.organizations.map((org) => (
                        <DropdownMenuItem key={org.id} asChild>
                          <Link 
                            href={`/switch-org/${org.slug}`} 
                            className="cursor-pointer"
                            onClick={() => setOpen(false)}
                          >
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

                  {user.firmMembership && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>สำนักงานบัญชี</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link 
                          href="/firm/dashboard" 
                          className="cursor-pointer"
                          onClick={() => setOpen(false)}
                        >
                          <Calculator className="mr-2 h-4 w-4" />
                          <span className="truncate">{user.firmMembership.firmName}</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/onboarding" 
                      className="cursor-pointer"
                      onClick={() => setOpen(false)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      สร้างธุรกิจใหม่
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {/* Create Button */}
            <Link
              href="/documents/new"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary/90 px-4 py-2.5 text-sm font-medium text-white transition-colors mb-4"
            >
              <Plus className="h-4 w-4" />
              สร้างกล่องใหม่
            </Link>

            {/* Main Menu - Everyone */}
            <div className="space-y-1">
              <p className="px-3 mb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                เมนูหลัก
              </p>
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
                    {item.title}
                  </Link>
                );
              })}
            </div>

            {/* Accounting Menu - ACCOUNTING, ADMIN, OWNER */}
            {isAccounting && (
              <div className="mt-6">
                <p className="px-3 mb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  งานบัญชี
                </p>
                <div className="space-y-1">
                  {accountingNavItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                          isActive
                            ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className={cn("h-4 w-4", isActive && "text-emerald-600 dark:text-emerald-400")} />
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Firm Portal - Only if firm member */}
            {isFirmMember && (
              <div className="mt-6">
                <p className="px-3 mb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  สำนักงานบัญชี
                </p>
                <div className="space-y-1">
                  <Link
                    href="/firm/dashboard"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      pathname.startsWith("/firm")
                        ? "bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Calculator className={cn("h-4 w-4", pathname.startsWith("/firm") && "text-violet-600 dark:text-violet-400")} />
                    เข้าสู่ Firm Portal
                  </Link>
                </div>
              </div>
            )}

            {/* Settings Menu - ADMIN, OWNER */}
            {isAdmin && (
              <div className="mt-6">
                <p className="px-3 mb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  ตั้งค่า
                </p>
                <div className="space-y-1">
                  {filteredSettings.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                          isActive
                            ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className={cn("h-4 w-4", isActive && "text-blue-600 dark:text-blue-400")} />
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Theme Toggle */}
            <div className="mt-6 px-3">
              <ThemeToggleCompact />
            </div>
          </nav>

          {/* User */}
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-3 px-2 py-2 mb-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">
                  {user.name || "ผู้ใช้"}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <form action="/api/auth/signout" method="POST">
              <Button 
                variant="outline" 
                className="w-full border-border text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-200 dark:hover:border-red-800" 
                type="submit"
              >
                <LogOut className="mr-2 h-4 w-4" />
                ออกจากระบบ
              </Button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
