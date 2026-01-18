"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
  Plus,
  Search,
  Tags,
  Briefcase,
  Download,
  BarChart3,
  Receipt,
  Menu,
  X,
  CalendarDays,
} from "lucide-react";
import type { SessionUser } from "@/types";

interface MobileNavProps {
  user: SessionUser;
}

const mainNavItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "เอกสารของฉัน", href: "/documents", icon: FileText },
  { title: "Inbox", href: "/inbox", icon: Inbox, roles: ["ACCOUNTING", "ADMIN", "OWNER"] },
  { title: "ติดตาม WHT", href: "/wht-tracking", icon: Receipt, roles: ["ACCOUNTING", "ADMIN", "OWNER"] },
  { title: "รายงาน", href: "/reports", icon: BarChart3, roles: ["ACCOUNTING", "ADMIN", "OWNER"] },
  { title: "Export", href: "/export", icon: Download, roles: ["ACCOUNTING", "ADMIN", "OWNER"] },
  { title: "กลุ่มค่าใช้จ่าย", href: "/expense-groups", icon: FolderOpen },
];

const settingsNavItems = [
  { title: "ตั้งค่าองค์กร", href: "/settings", icon: Building2 },
  { title: "สมาชิก", href: "/settings/members", icon: Users },
  { title: "ผู้ติดต่อ", href: "/settings/contacts", icon: UserRound },
  { title: "หมวดหมู่", href: "/settings/categories", icon: Tags },
  { title: "ศูนย์ต้นทุน", href: "/settings/cost-centers", icon: Briefcase },
  { title: "งวดบัญชี", href: "/settings/fiscal-periods", icon: CalendarDays },
];

export function MobileNav({ user }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Package className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">กล่องเอกสาร</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Organization */}
          {user.currentOrganization && (
            <div className="border-b p-3">
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.currentOrganization.name}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user.currentOrganization.role.toLowerCase()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="p-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              asChild
              onClick={() => setOpen(false)}
            >
              <Link href="/search">
                <Search className="mr-2 h-4 w-4" />
                ค้นหาเอกสาร...
              </Link>
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-2">
            <div className="space-y-1">
              {mainNavItems.map((item) => {
                if (item.roles && user.currentOrganization) {
                  if (!item.roles.includes(user.currentOrganization.role)) {
                    return null;
                  }
                }

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
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                );
              })}
            </div>

            {/* Settings */}
            {user.currentOrganization?.role !== "STAFF" && (
              <div className="mt-6">
                <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
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
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </nav>

          {/* User */}
          <div className="border-t p-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name || "ไม่ระบุชื่อ"}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <form action="/api/auth/signout" method="POST" className="mt-3">
              <Button variant="outline" className="w-full" type="submit">
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
