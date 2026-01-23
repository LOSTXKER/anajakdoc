"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Briefcase,
} from "lucide-react";
import type { SessionUser } from "@/types";
import { ThemeToggleCompact } from "@/components/ui/theme-toggle";

interface MobileNavProps {
  user: SessionUser;
}

const mainNavItems = [
  { title: "เอกสาร", href: "/documents", icon: Package },
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

const accountingItems = [
  { title: "ติดตาม WHT", href: "/wht-tracking", icon: Receipt },
  { title: "รอคืนเงิน", href: "/documents?reimburse=pending", icon: Wallet },
  { title: "Export", href: "/export", icon: Download },
  { title: "รายงาน", href: "/reports", icon: BarChart3 },
];

const settingsNavItems = [
  { title: "องค์กร", href: "/settings", icon: Building2 },
  { title: "สมาชิก", href: "/settings/members", icon: Users },
  { title: "ผู้ติดต่อ", href: "/settings/contacts", icon: UserRound },
  { title: "หมวดหมู่", href: "/settings/categories", icon: Tags },
  { title: "งวดบัญชี", href: "/settings/fiscal-periods", icon: Calendar },
];

export function MobileNav({ user }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const isAccounting = user.currentOrganization && 
    ["ACCOUNTING", "ADMIN", "OWNER"].includes(user.currentOrganization.role);
  
  const isAdmin = user.currentOrganization && 
    ["ADMIN", "OWNER"].includes(user.currentOrganization.role);

  const isFirmMember = !!user.firmMembership;

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
          <div className="flex h-16 items-center justify-between px-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg text-foreground">กล่องเอกสาร</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground hover:bg-muted">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Organization */}
          {user.currentOrganization && (
            <div className="px-3 py-3 border-b border-border">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-card border border-border text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">
                    {user.currentOrganization.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.currentOrganization.role === "OWNER" ? "เจ้าของ" : 
                     user.currentOrganization.role === "ADMIN" ? "ผู้ดูแล" :
                     user.currentOrganization.role === "ACCOUNTING" ? "บัญชี" : "พนักงาน"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {/* Create Button */}
            <Link
              href="/documents/new"
              onClick={() => setOpen(false)}
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

            {/* Accounting Menu */}
            {isAccounting && (
              <div className="mt-6">
                <p className="px-3 mb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  งานบัญชี
                </p>
                <div className="space-y-1">
                  {accountingItems.map((item) => {
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

            {/* Firm Menu */}
            {(isFirmMember || isAdmin) && (
              <div className="mt-6">
                <p className="px-3 mb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  สำนักงานบัญชี
                </p>
                <div className="space-y-1">
                  {isFirmMember ? (
                    <Link
                      href="/firm"
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                        pathname.startsWith("/firm")
                          ? "bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Briefcase className={cn("h-4 w-4", pathname.startsWith("/firm") && "text-violet-600 dark:text-violet-400")} />
                      ภาพรวมลูกค้า
                    </Link>
                  ) : (
                    <Link
                      href="/firm/setup"
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                        pathname === "/firm/setup"
                          ? "bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Plus className="h-4 w-4" />
                      สร้างสำนักงานบัญชี
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Settings Menu */}
            {isAdmin && (
              <div className="mt-6">
                <p className="px-3 mb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  ตั้งค่า
                </p>
                <div className="space-y-1">
                  {settingsNavItems.map((item) => {
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
